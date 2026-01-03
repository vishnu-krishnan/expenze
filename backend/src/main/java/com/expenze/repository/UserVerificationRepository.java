package com.expenze.repository;

import com.expenze.entity.UserVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserVerificationRepository extends JpaRepository<UserVerification, String> {
    Optional<UserVerification> findByEmail(String email);

    void deleteByEmail(String email);
}
