package com.busmanagement.BusManagementSystem.service;

import com.busmanagement.BusManagementSystem.model.Passenger;
import com.busmanagement.BusManagementSystem.repository.PassengerRepository;
import com.busmanagement.BusManagementSystem.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class PassengerService {

    @Autowired
    private PassengerRepository passengerRepository;

    public List<Passenger> getAllPassengers() {
        return passengerRepository.findAll();
    }

    public Passenger getPassengerById(Long id) {
        return passengerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Passenger not found with id: " + id));
    }

    public Passenger getPassengerByEmail(String email) {
        return passengerRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Passenger not found with email: " + email));
    }

    public Passenger createPassenger(Passenger passenger) {
        if (passengerRepository.existsByEmail(passenger.getEmail())) {
            throw new RuntimeException("Passenger with email " + passenger.getEmail() + " already exists");
        }
        if (passengerRepository.existsByPhoneNumber(passenger.getPhoneNumber())) {
            throw new RuntimeException("Passenger with phone number " + passenger.getPhoneNumber() + " already exists");
        }
        return passengerRepository.save(passenger);
    }

    public Passenger updatePassenger(Long id, Passenger passengerDetails) {
        Passenger passenger = getPassengerById(id);
        
        // Check if email is being changed and if it already exists
        if (!passenger.getEmail().equals(passengerDetails.getEmail()) && 
            passengerRepository.existsByEmail(passengerDetails.getEmail())) {
            throw new RuntimeException("Passenger with email " + passengerDetails.getEmail() + " already exists");
        }
        
        // Check if phone number is being changed and if it already exists
        if (!passenger.getPhoneNumber().equals(passengerDetails.getPhoneNumber()) && 
            passengerRepository.existsByPhoneNumber(passengerDetails.getPhoneNumber())) {
            throw new RuntimeException("Passenger with phone number " + passengerDetails.getPhoneNumber() + " already exists");
        }
        
        passenger.setFirstName(passengerDetails.getFirstName());
        passenger.setLastName(passengerDetails.getLastName());
        passenger.setEmail(passengerDetails.getEmail());
        passenger.setPhoneNumber(passengerDetails.getPhoneNumber());
        passenger.setAddress(passengerDetails.getAddress());
        
        return passengerRepository.save(passenger);
    }

    public void deletePassenger(Long id) {
        Passenger passenger = getPassengerById(id);
        passengerRepository.delete(passenger);
    }

    public boolean passengerExists(String email) {
        return passengerRepository.existsByEmail(email);
    }
}