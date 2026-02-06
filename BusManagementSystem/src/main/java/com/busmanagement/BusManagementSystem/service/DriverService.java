package com.busmanagement.BusManagementSystem.service;

import com.busmanagement.BusManagementSystem.model.Driver;
import com.busmanagement.BusManagementSystem.model.Bus;
import com.busmanagement.BusManagementSystem.repository.DriverRepository;
import com.busmanagement.BusManagementSystem.repository.BusRepository;
import com.busmanagement.BusManagementSystem.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class DriverService {

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private BusRepository busRepository;

    public List<Driver> getAllDrivers() {
        return driverRepository.findAll();
    }

    public Driver getDriverById(Long id) {
        return driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + id));
    }

    public Driver getDriverByLicense(String licenseNumber) {
        return driverRepository.findByLicenseNumber(licenseNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with license: " + licenseNumber));
    }

    public Driver createDriver(Driver driver) {
        if (driverRepository.existsByLicenseNumber(driver.getLicenseNumber())) {
            throw new RuntimeException("Driver with license number " + driver.getLicenseNumber() + " already exists");
        }
        if (driverRepository.existsByEmail(driver.getEmail())) {
            throw new RuntimeException("Driver with email " + driver.getEmail() + " already exists");
        }
        return driverRepository.save(driver);
    }

    public Driver updateDriver(Long id, Driver driverDetails) {
        Driver driver = getDriverById(id);
        
        // Check if license number is being changed and if it already exists
        if (!driver.getLicenseNumber().equals(driverDetails.getLicenseNumber()) && 
            driverRepository.existsByLicenseNumber(driverDetails.getLicenseNumber())) {
            throw new RuntimeException("Driver with license number " + driverDetails.getLicenseNumber() + " already exists");
        }
        
        // Check if email is being changed and if it already exists
        if (!driver.getEmail().equals(driverDetails.getEmail()) && 
            driverRepository.existsByEmail(driverDetails.getEmail())) {
            throw new RuntimeException("Driver with email " + driverDetails.getEmail() + " already exists");
        }
        
        driver.setName(driverDetails.getName());
        driver.setLicenseNumber(driverDetails.getLicenseNumber());
        driver.setContactNumber(driverDetails.getContactNumber());
        driver.setEmail(driverDetails.getEmail());
        driver.setAddress(driverDetails.getAddress());
        driver.setDateOfBirth(driverDetails.getDateOfBirth());
        driver.setExperienceYears(driverDetails.getExperienceYears());
        driver.setIsAvailable(driverDetails.getIsAvailable());
        
        return driverRepository.save(driver);
    }

    public void deleteDriver(Long id) {
        Driver driver = getDriverById(id);
        driverRepository.delete(driver);
    }

    public List<Driver> getAvailableDrivers() {
        return driverRepository.findByIsAvailableTrue();
    }

    public Driver assignBusToDriver(Long driverId, Long busId) {
        Driver driver = getDriverById(driverId);
        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + busId));
        
        driver.setAssignedBus(bus);
        return driverRepository.save(driver);
    }

    public Driver removeBusFromDriver(Long driverId) {
        Driver driver = getDriverById(driverId);
        driver.setAssignedBus(null);
        return driverRepository.save(driver);
    }

    public Driver updateDriverAvailability(Long id, Boolean isAvailable) {
        Driver driver = getDriverById(id);
        driver.setIsAvailable(isAvailable);
        return driverRepository.save(driver);
    }
}