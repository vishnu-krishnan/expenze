-- Create category_templates table for smart sub-options
CREATE TABLE IF NOT EXISTS category_templates (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    sub_option VARCHAR(100) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_category_template_category FOREIGN KEY (category_id) 
        REFERENCES categories(id) ON DELETE CASCADE,
    CONSTRAINT fk_category_template_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX idx_category_templates_user_category 
    ON category_templates(user_id, category_id);

CREATE INDEX idx_category_templates_active 
    ON category_templates(user_id, is_active);
