package com.busmanagement.BusManagementSystem.service;

import com.busmanagement.BusManagementSystem.model.Route;
import com.busmanagement.BusManagementSystem.repository.RouteRepository;
import com.busmanagement.BusManagementSystem.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class RouteService {

    @Autowired
    private RouteRepository routeRepository;

    public List<Route> getAllRoutes() {
        return routeRepository.findAll();
    }

    public Route getRouteById(Long id) {
        return routeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + id));
    }

    public Route createRoute(Route route) {
        // Check if route with same source and destination already exists
        Optional<Route> existingRoute = routeRepository.findBySourceAndDestination(
                route.getSource(), route.getDestination());
        if (existingRoute.isPresent()) {
            throw new RuntimeException("Route from " + route.getSource() + " to " + route.getDestination() + " already exists");
        }
        return routeRepository.save(route);
    }

    public Route updateRoute(Long id, Route routeDetails) {
        Route route = getRouteById(id);
        
        // Check if source/destination is being changed and if it conflicts with existing route
        if (!route.getSource().equals(routeDetails.getSource()) || 
            !route.getDestination().equals(routeDetails.getDestination())) {
            Optional<Route> existingRoute = routeRepository.findBySourceAndDestination(
                    routeDetails.getSource(), routeDetails.getDestination());
            if (existingRoute.isPresent() && !existingRoute.get().getId().equals(id)) {
                throw new RuntimeException("Route from " + routeDetails.getSource() + " to " + routeDetails.getDestination() + " already exists");
            }
        }
        
        route.setSource(routeDetails.getSource());
        route.setDestination(routeDetails.getDestination());
        route.setDistance(routeDetails.getDistance());
        route.setEstimatedTravelTime(routeDetails.getEstimatedTravelTime());
        route.setDescription(routeDetails.getDescription());
        
        return routeRepository.save(route);
    }

    public void deleteRoute(Long id) {
        Route route = getRouteById(id);
        routeRepository.delete(route);
    }

    public List<Route> getRoutesBySource(String source) {
        return routeRepository.findBySource(source);
    }

    public List<Route> getRoutesByDestination(String destination) {
        return routeRepository.findByDestination(destination);
    }

    public Optional<Route> getRouteBySourceAndDestination(String source, String destination) {
        return routeRepository.findBySourceAndDestination(source, destination);
    }

    public List<String> getAllUniqueSources() {
        return routeRepository.findAllUniqueSources();
    }

    public List<String> getAllUniqueDestinations() {
        return routeRepository.findAllUniqueDestinations();
    }
}