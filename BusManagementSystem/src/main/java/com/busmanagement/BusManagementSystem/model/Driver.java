package com.busmanagement.BusManagementSystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "drivers")
@Data
public class Driver {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String licenseNumber;

    @Column(nullable = false)
    private String contactNumber;

    @Column(nullable = false)
    private String email;

    private String address;

    @Column(nullable = false)
    private LocalDate dateOfBirth;

    private Integer experienceYears;

    private Boolean isAvailable = true;

    @OneToOne
    @JoinColumn(name = "bus_id")
    private Bus assignedBus;
}