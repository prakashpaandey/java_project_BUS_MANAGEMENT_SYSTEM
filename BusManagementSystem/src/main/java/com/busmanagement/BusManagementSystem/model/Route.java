package com.busmanagement.BusManagementSystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "routes")
@Data
public class Route {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String source;

    @Column(nullable = false)
    private String destination;

    @Column(nullable = false)
    private Double distance; // in kilometers

    @Column(nullable = false)
    private Integer estimatedTravelTime; // in minutes

    private String description;

    @OneToMany(mappedBy = "route", cascade = CascadeType.ALL)
    private List<Schedule> schedules = new ArrayList<>();
}