package hairmony.service;

import hairmony.dto.ProfileDTO;
import hairmony.entities.*;
import hairmony.repository.BarbershopRepository;
import hairmony.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import hairmony.serviceInterfaces.ProfileServiceInf;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileService implements ProfileServiceInf {

    private final UserRepository userRepository;
    private final BarbershopRepository barbershopRepository;
    private final PasswordEncoder passwordEncoder;

    public ProfileDTO getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toProfileDTO(user);
    }

    public ProfileDTO updateProfile(Long userId, ProfileDTO changes) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update username if provided
        if (changes.getUsername() != null && !changes.getUsername().isBlank()) {
            user.setUsername(changes.getUsername());
        }

        // Update picture if a new file is provided
        if (changes.getPictureFile() != null && !changes.getPictureFile().isEmpty()) {
            String path = saveFileToUploads(changes.getPictureFile());
            user.setPicture(path);
        }

        // Update password if provided
        if (changes.getNewPassword() != null && !changes.getNewPassword().isBlank()) {
            String hashed = passwordEncoder.encode(changes.getNewPassword());
            user.setPassword(hashed);
        }

        // Update barber-specific fields
        if (user instanceof Barber) {
            Barber barber = (Barber) user;
            if (changes.getSpecialty() != null) {
                barber.setSpecialty(changes.getSpecialty());
            }
            if (changes.getBarbershopId() != null) {
                Barbershop shop = barbershopRepository.findById(changes.getBarbershopId())
                        .orElseThrow(() -> new RuntimeException("Barbershop not found"));
                barber.setBarbershop(shop);
            }
        }
        // Update client-specific fields
        else if (user instanceof Client) {
            Client client = (Client) user;
            if (changes.getFaceShape() != null) {
                client.setFaceShape(changes.getFaceShape());
            }
        }

        userRepository.save(user);
        return toProfileDTO(user);
    }

    private ProfileDTO toProfileDTO(User user) {
        ProfileDTO dto = new ProfileDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setRole(user.getRole());
        dto.setPicturePath(user.getPicture()); // Set the picture path, not the file

        dto.setUnlimitedAccess(user.isUnlimitedAccess());
        dto.setVIPSubscriber(user.isVIPSubscriber());
        dto.setNormalSubscriber(user.isNormalSubscriber());
        dto.setFreeTrialsRemaining(user.getFreeTrialsRemaining());
        dto.setLiveTrialsRemaining(user.getLiveTrialsRemaining());

        if (user instanceof Barber) {
            Barber barber = (Barber) user;
            dto.setSpecialty(barber.getSpecialty());
            dto.setRating(barber.getRating());
            if (barber.getBarbershop() != null) {
                Barbershop shop = barber.getBarbershop();
                dto.setBarbershopId(shop.getId());
                dto.setBarbershopName(shop.getName());
            }
        } else if (user instanceof Client) {
            Client client = (Client) user;
            dto.setFaceShape(client.getFaceShape());
            if (client.getSubscription() != null) {
                dto.setSubscriptionId(client.getSubscription().getId());
                dto.setSubscriptionName(client.getSubscription().getName());
            }
        }
        return dto;
    }

    public void deleteAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
    }

    private String saveFileToUploads(MultipartFile file) {
        try {
            Path uploadsDir = Paths.get("uploads");
            Files.createDirectories(uploadsDir);

            String originalFilename = file.getOriginalFilename();
            String uniqueFilename = UUID.randomUUID() + "_" + originalFilename;

            Path targetPath = uploadsDir.resolve(uniqueFilename).normalize();
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            return "uploads/" + uniqueFilename;
        } catch (IOException e) {
            throw new RuntimeException("Could not store file. Error: " + e.getMessage());
        }
    }
}