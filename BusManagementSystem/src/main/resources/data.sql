-- Insert sample admin
INSERT INTO admins (username, password, email, full_name, role) 
VALUES ('admin', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'admin@busmanagement.com', 'Ram Kumar Pandey', 'ADMIN');

-- Insert sample routes
INSERT INTO routes (source, destination, distance, estimated_travel_time, description) 
VALUES 
('Kathmandu', 'Pokhara', 200.0, 300, 'Direct route from Kathmandu to Pokhara'),
('Kathmandu', 'Chitwan', 150.0, 240, 'Direct route from Kathmandu to Chitwan'),
('Pokhara', 'Chitwan', 170.0, 260, 'Direct route from Pokhara to Chitwan');

-- Insert sample buses
INSERT INTO buses (bus_number, bus_type, total_seats, available_seats, fare_per_km, is_available, current_location) 
VALUES 
('BUS001', 'AC', 40, 40, 2.5, true, 'Kathmandu Depot'),
('BUS002', 'Non-AC', 50, 50, 1.8, true, 'Pokhara Depot'),
('BUS003', 'Sleeper', 30, 30, 3.2, true, 'Chitwan Depot');

-- Insert sample drivers
INSERT INTO drivers (name, license_number, contact_number, email, address, date_of_birth, experience_years, is_available) 
VALUES 
('Suresh Thapa', 'DL123456', '+977-9810101010', 'suresh.thapa@buscompany.com', 'Bagbazar, Kathmandu', '1985-05-15', 10, true),
('Gita Shrestha', 'DL123457', '+977-9810101020', 'gita.shrestha@buscompany.com', 'Lakeside, Pokhara', '1990-08-20', 7, true),
('Ram Prasad Adhikari', 'DL123458', '+977-9810101030', 'ram.adhikari@buscompany.com', 'Bharatpur, Chitwan', '1988-12-10', 8, true);
