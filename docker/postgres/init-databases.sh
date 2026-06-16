#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE ecom_auth;
    CREATE DATABASE ecom_user;
    CREATE DATABASE ecom_product;
    CREATE DATABASE ecom_inventory;
    CREATE DATABASE ecom_cart;
    CREATE DATABASE ecom_order;
    CREATE DATABASE ecom_payment;
EOSQL
