package com.busmanagement.BusManagementSystem.service;

import com.busmanagement.BusManagementSystem.model.Admin;
import com.busmanagement.BusManagementSystem.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.ArrayList;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private AdminRepository adminRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        Admin admin = adminRepository.findByUsername(identifier)
                .or(() -> adminRepository.findByEmail(identifier))
                .orElseThrow(() -> new UsernameNotFoundException("Admin not found with identifier: " + identifier));
        
        return new User(admin.getUsername(), admin.getPassword(), new ArrayList<>());
    }
}