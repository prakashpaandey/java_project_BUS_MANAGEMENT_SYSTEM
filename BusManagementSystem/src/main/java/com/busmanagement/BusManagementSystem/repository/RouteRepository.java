package com.busmanagement.BusManagementSystem.repository;

import com.busmanagement.BusManagementSystem.model.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RouteRepository extends JpaRepository<Route, Long> {
    Optional<Route> findBySourceAndDestination(String source, String destination);
    List<Route> findBySource(String source);
    List<Route> findByDestination(String destination);
    
    @Query("SELECT DISTINCT r.source FROM Route r")
    List<String> findAllUniqueSources();
    
    @Query("SELECT DISTINCT r.destination FROM Route r")
    List<String> findAllUniqueDestinations();
}