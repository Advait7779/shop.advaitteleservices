CREATE INDEX "users_role_createdAt_id_idx" ON "users"("role", "createdAt", "id");
CREATE INDEX "products_updatedAt_id_idx" ON "products"("updatedAt", "id");
CREATE INDEX "products_inStock_updatedAt_id_idx" ON "products"("inStock", "updatedAt", "id");
CREATE INDEX "products_inStock_createdAt_id_idx" ON "products"("inStock", "createdAt", "id");
CREATE INDEX "orders_createdAt_id_idx" ON "orders"("createdAt", "id");
CREATE INDEX "orders_status_createdAt_id_idx" ON "orders"("status", "createdAt", "id");
CREATE INDEX "orders_userId_status_idx" ON "orders"("userId", "status");
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");
