package com.busmanagement.BusManagementSystem.repository;

import com.busmanagement.BusManagementSystem.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {
    Optional<Driver> findByLicenseNumber(String licenseNumber);
    List<Driver> findByIsAvailableTrue();
    Optional<Driver> findByAssignedBusId(Long busId);
    boolean existsByLicenseNumber(String licenseNumber);
    boolean existsByEmail(String email);
}