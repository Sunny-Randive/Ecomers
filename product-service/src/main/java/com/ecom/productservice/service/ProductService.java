package com.ecom.productservice.service;

import com.ecom.productservice.domain.model.Category;
import com.ecom.productservice.domain.model.Product;
import com.ecom.productservice.domain.model.ProductImage;
import com.ecom.productservice.dto.ProductDto;
import com.ecom.productservice.dto.ProductImageDto;
import com.ecom.productservice.dto.ProductResponseDto;
import com.ecom.productservice.repository.CategoryRepository;
import com.ecom.productservice.repository.ProductImageRepository;
import com.ecom.productservice.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductImageRepository productImageRepository;
    private final org.springframework.kafka.core.KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional(readOnly = true)
    @Cacheable(value = "products", key = "#id", unless = "#result == null")
    public ProductResponseDto getProductById(UUID id) {
        log.info("Fetching product {} from database", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        return mapToResponseDto(product);
    }

    @Transactional
    public ProductResponseDto createProduct(ProductDto dto) {
        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        Product product = Product.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .discount(dto.getDiscount() != null ? dto.getDiscount() : java.math.BigDecimal.ZERO)
                .category(category)
                .build();

        Product savedProduct = productRepository.save(product);
        return mapToResponseDto(savedProduct);
    }

    @Transactional
    @CachePut(value = "products", key = "#id")
    public ProductResponseDto updateProduct(UUID id, ProductDto dto) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setPrice(dto.getPrice());
        product.setDiscount(dto.getDiscount() != null ? dto.getDiscount() : java.math.BigDecimal.ZERO);
        product.setCategory(category);

        Product updatedProduct = productRepository.save(product);
        return mapToResponseDto(updatedProduct);
    }

    @Transactional
    @CacheEvict(value = "products", key = "#id")
    public void deleteProduct(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        productRepository.delete(product);
        
        // Publish event to notify other services (like cart-service) that the product was deleted
        com.ecom.common.event.ProductDeletedEvent event = com.ecom.common.event.ProductDeletedEvent.builder()
                .productId(id)
                .build();
        kafkaTemplate.send("product-events", id.toString(), event);
        log.info("Published ProductDeletedEvent for productId: {}", id);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponseDto> searchProducts(String query, Pageable pageable) {
        Page<Product> products = productRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                query, query, pageable);
        return products.map(this::mapToResponseDto);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponseDto> getProductsByCategory(UUID categoryId, Pageable pageable) {
        Page<Product> products = productRepository.findByCategoryId(categoryId, pageable);
        return products.map(this::mapToResponseDto);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponseDto> getAllProducts(Pageable pageable) {
        Page<Product> products = productRepository.findAll(pageable);
        return products.map(this::mapToResponseDto);
    }

    @Transactional
    @CacheEvict(value = "products", key = "#productId")
    public ProductImageDto addImage(UUID productId, ProductImageDto imageDto) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        if (imageDto.isPrimary()) {
            resetPrimaryImages(productId);
        }

        ProductImage image = ProductImage.builder()
                .product(product)
                .imageUrl(imageDto.getImageUrl())
                .isPrimary(imageDto.isPrimary())
                .build();

        ProductImage savedImage = productImageRepository.save(image);
        return mapToImageDto(savedImage);
    }

    @Transactional
    public void deleteImage(UUID productId, UUID imageId) {
        ProductImage image = productImageRepository.findById(imageId)
                .orElseThrow(() -> new IllegalArgumentException("Image not found"));

        if (!image.getProduct().getId().equals(productId)) {
            throw new IllegalArgumentException("Image does not belong to this product");
        }

        productImageRepository.delete(image);
    }

    private void resetPrimaryImages(UUID productId) {
        List<ProductImage> images = productImageRepository.findByProductId(productId);
        images.forEach(img -> {
            if (img.isPrimary()) {
                img.setPrimary(false);
                productImageRepository.save(img);
            }
        });
    }

    private ProductResponseDto mapToResponseDto(Product product) {
        List<ProductImage> images = productImageRepository.findByProductId(product.getId());
        List<ProductImageDto> imageDtos = images.stream()
                .map(this::mapToImageDto)
                .collect(Collectors.toList());

        java.math.BigDecimal discount = product.getDiscount() != null ? product.getDiscount() : java.math.BigDecimal.ZERO;
        java.math.BigDecimal discountedPrice = product.getPrice();
        if (discount.compareTo(java.math.BigDecimal.ZERO) > 0) {
            java.math.BigDecimal factor = java.math.BigDecimal.ONE.subtract(discount.divide(java.math.BigDecimal.valueOf(100)));
            discountedPrice = product.getPrice().multiply(factor);
        }

        return ProductResponseDto.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .discount(discount)
                .discountedPrice(discountedPrice)
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .images(imageDtos)
                .build();
    }

    private ProductImageDto mapToImageDto(ProductImage image) {
        return ProductImageDto.builder()
                .id(image.getId())
                .productId(image.getProduct().getId())
                .imageUrl(image.getImageUrl())
                .isPrimary(image.isPrimary())
                .build();
    }
}
