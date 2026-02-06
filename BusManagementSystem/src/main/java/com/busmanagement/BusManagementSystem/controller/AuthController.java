package com.busmanagement.BusManagementSystem.controller;

import com.busmanagement.BusManagementSystem.model.Admin;
import com.busmanagement.BusManagementSystem.service.AdminService;
import com.busmanagement.BusManagementSystem.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private AdminService adminService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        try {
            String username = loginRequest.get("username");
            String password = loginRequest.get("password");

            
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
            );

          
            final UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            final String jwt = jwtUtil.generateToken(userDetails.getUsername());

            
            Admin admin = adminService.getAdminByIdentifier(username);

            Map<String, Object> response = new java.util.HashMap<>();
            response.put("message", "Login successful");
            response.put("token", jwt);
            
            Map<String, Object> adminData = new java.util.HashMap<>();
            adminData.put("id", admin.getId());
            adminData.put("username", admin.getUsername());
            adminData.put("email", admin.getEmail());
            adminData.put("fullName", admin.getFullName());
            adminData.put("role", admin.getRole());
            
            response.put("admin", adminData);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Invalid credentials"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Admin admin) {
        try {
            Admin createdAdmin = adminService.createAdmin(admin);
            return ResponseEntity.ok(Map.of(
                "message", "Admin registered successfully",
                "admin", Map.of(
                    "id", createdAdmin.getId(),
                    "username", createdAdmin.getUsername(),
                    "email", createdAdmin.getEmail(),
                    "fullName", createdAdmin.getFullName()
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String token) {
        try {
            if (token != null && token.startsWith("Bearer ")) {
                String jwt = token.substring(7);
                String username = jwtUtil.extractUsername(jwt);
                
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                if (jwtUtil.validateToken(jwt, userDetails)) {
                    Admin admin = adminService.getAdminByIdentifier(username);
                    return ResponseEntity.ok(Map.of(
                        "valid", true,
                        "admin", Map.of(
                            "id", admin.getId(),
                            "username", admin.getUsername(),
                            "email", admin.getEmail(),
                            "fullName", admin.getFullName(),
                            "role", admin.getRole()
                        )
                    ));
                }
            }
            return ResponseEntity.ok(Map.of("valid", false));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("valid", false));
        }
    }
}