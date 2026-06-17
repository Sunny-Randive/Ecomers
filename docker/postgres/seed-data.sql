-- Connect to ecom_product database
\c ecom_product;

-- Clear existing data
TRUNCATE TABLE product_images CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE categories CASCADE;

-- Seed Categories
INSERT INTO categories (id, name, description) VALUES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Electronics', 'Phones, computers, and headphones'),
('b2c3d4e5-f6fa-7a8b-9c0d-1e2f3a4b5c6d', 'Clothing', 'Fashion, shirts, and jackets'),
('c3d4e5f6-faf6-7a8b-9c0d-1e2f3a4b5c6d', 'Home & Living', 'Furniture, decorations, and tools');

-- Seed Products
INSERT INTO products (id, name, description, price, category_id, created_at) VALUES
('f1a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d', 'Wireless Noise-Canceling Headphones', 'Experience premium sound quality and advanced active noise-canceling with these sleek over-ear wireless headphones.', 99.99, 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', NOW()),
('f2a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d', 'Premium 5G Smartphone', 'A high-performance smartphone featuring a stunning OLED display, pro-grade camera system, and ultra-fast 5G connectivity.', 799.99, 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', NOW()),
('f3a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d', 'Classic Denim Jacket', 'A versatile and durable classic denim jacket made from premium organic cotton, perfect for any casual look.', 59.99, 'b2c3d4e5-f6fa-7a8b-9c0d-1e2f3a4b5c6d', NOW()),
('f4a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d', 'Ergonomic Office Chair', 'Enhance your posture and comfort with this fully adjustable ergonomic office chair featuring breathable mesh back support.', 149.99, 'c3d4e5f6-faf6-7a8b-9c0d-1e2f3a4b5c6d', NOW());

-- Seed Product Images (using royalty-free placeholder images from unsplash)
INSERT INTO product_images (id, product_id, image_url, is_primary) VALUES
(gen_random_uuid(), 'f1a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', TRUE),
(gen_random_uuid(), 'f2a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500', TRUE),
(gen_random_uuid(), 'f3a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d', 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500', TRUE),
(gen_random_uuid(), 'f4a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d', 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=500', TRUE);

-- Connect to ecom_inventory database
\c ecom_inventory;

-- Clear existing data
TRUNCATE TABLE inventories CASCADE;

-- Seed Inventory quantities
INSERT INTO inventories (product_id, available_quantity, reserved_quantity) VALUES
('f1a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d', 50, 0),
('f2a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d', 20, 0),
('f3a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d', 100, 0),
('f4a2b3c4-d5e6-7a8b-9c0d-1e2f3a4b5c6d', 15, 0);
