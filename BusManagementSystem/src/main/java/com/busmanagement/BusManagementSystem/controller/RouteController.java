package com.busmanagement.BusManagementSystem.controller;

import com.busmanagement.BusManagementSystem.model.Route;
import com.busmanagement.BusManagementSystem.service.RouteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/routes")
@CrossOrigin(origins = "*")
public class RouteController {

    @Autowired
    private RouteService routeService;

    @GetMapping
    public List<Route> getAllRoutes() {
        return routeService.getAllRoutes();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Route> getRouteById(@PathVariable Long id) {
        try {
            Route route = routeService.getRouteById(id);
            return ResponseEntity.ok(route);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createRoute(@RequestBody Route route) {
        try {
            Route createdRoute = routeService.createRoute(route);
            return ResponseEntity.ok(createdRoute);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRoute(@PathVariable Long id, @RequestBody Route routeDetails) {
        try {
            Route updatedRoute = routeService.updateRoute(id, routeDetails);
            return ResponseEntity.ok(updatedRoute);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRoute(@PathVariable Long id) {
        try {
            routeService.deleteRoute(id);
            return ResponseEntity.ok().body(Map.of("message", "Route deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/source/{source}")
    public List<Route> getRoutesBySource(@PathVariable String source) {
        return routeService.getRoutesBySource(source);
    }

    @GetMapping("/destination/{destination}")
    public List<Route> getRoutesByDestination(@PathVariable String destination) {
        return routeService.getRoutesByDestination(destination);
    }

    @GetMapping("/search")
    public ResponseEntity<?> getRouteBySourceAndDestination(
            @RequestParam String source, 
            @RequestParam String destination) {
        try {
            Route route = routeService.getRouteBySourceAndDestination(source, destination)
                    .orElseThrow(() -> new RuntimeException("Route not found from " + source + " to " + destination));
            return ResponseEntity.ok(route);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/sources")
    public List<String> getAllUniqueSources() {
        return routeService.getAllUniqueSources();
    }

    @GetMapping("/destinations")
    public List<String> getAllUniqueDestinations() {
        return routeService.getAllUniqueDestinations();
    }
}