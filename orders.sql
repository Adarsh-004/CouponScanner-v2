CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(150),
  phone VARCHAR(20),
  artworkType VARCHAR(100),
  frameSize VARCHAR(100),
  artStyle VARCHAR(100),
  colorScheme VARCHAR(100),
  urgency VARCHAR(50),
  specialInstructions TEXT,
  budget VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
