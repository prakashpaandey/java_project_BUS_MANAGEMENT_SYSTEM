package com.busmanagement.BusManagementSystem.config;

import com.busmanagement.BusManagementSystem.model.Admin;
import com.busmanagement.BusManagementSystem.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        String email = "prakashpandey@gmail.com";
        String username = "prakashpandey"; // Using part of email as username
        String password = "prakashpandey";

        if (!adminRepository.existsByUsername(username) && !adminRepository.existsByEmail(email)) {
            Admin admin = new Admin();
            admin.setUsername(username);
            admin.setEmail(email);
            admin.setFullName("Prakash Pandey");
            admin.setPassword(passwordEncoder.encode(password));
            admin.setRole("ADMIN");
            adminRepository.save(admin);
            System.out.println("Admin user seeded: " + username);
        }
    }
}
