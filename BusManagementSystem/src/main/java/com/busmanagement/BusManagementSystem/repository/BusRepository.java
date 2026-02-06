package com.busmanagement.BusManagementSystem.repository;

import com.busmanagement.BusManagementSystem.model.Bus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BusRepository extends JpaRepository<Bus, Long> {
    Optional<Bus> findByBusNumber(String busNumber);
    List<Bus> findByIsAvailableTrue();
    List<Bus> findByCurrentLocation(String location);
    List<Bus> findByBusType(String busType);
    
    @Query("SELECT b FROM Bus b WHERE b.availableSeats > 0 AND b.isAvailable = true")
    List<Bus> findAvailableBusesWithSeats();
    
    boolean existsByBusNumber(String busNumber);
}