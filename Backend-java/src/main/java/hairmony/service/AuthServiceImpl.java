package hairmony.service;

import hairmony.entities.*;
import hairmony.repository.BarbershopRepository;
import hairmony.repository.UserRepository;
import hairmony.serviceInterfaces.AuthServiceInf;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthServiceInf {

    private final UserRepository userRepository;
    private final BarbershopRepository barbershopRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public String registerUser(
            String username,
            String password,
            String role,
            MultipartFile pictureFile,
            String barbershopId,
            String barbershopName,
            String barbershopAddress,
            MultipartFile barbershopPic
    ) {
        // 1) Check username
        if (userRepository.findByUsername(username).isPresent()) {
            return "Username already taken!";
        }

        // 2) Encode password
        String encodedPass = passwordEncoder.encode(password);

        // 3) Save user’s picture if provided
        String userPicturePath = null;
        if (pictureFile != null && !pictureFile.isEmpty()) {
            userPicturePath = saveFileToUploads(pictureFile);
        }

        // 4) Create user based on role
        User newUser;
        switch (role.toUpperCase()) {
            case "CLIENT" -> {
                newUser = new Client(username, encodedPass, "CLIENT", userPicturePath, null);
            }
            case "ADMIN" -> {
                newUser = new Admin(username, encodedPass, "ADMIN", userPicturePath);
            }
            case "BARBER" -> {
                Barbershop barbershop = handleBarbershopLogic(barbershopId, barbershopName, barbershopAddress, barbershopPic);
                Barber barber = new Barber(username, encodedPass, "BARBER", userPicturePath, null, 0.0);
                if (barbershop != null) {
                    barber.setBarbershop(barbershop);
                }
                newUser = barber;
            }
            default -> {
                return "Invalid role. Must be CLIENT, BARBER, or ADMIN.";
            }
        }

        userRepository.save(newUser);
        return "Registration successful for " + username;
    }

    // Helper to handle barbershop creation or fetching existing
    private Barbershop handleBarbershopLogic(
            String barbershopId,
            String barbershopName,
            String barbershopAddress,
            MultipartFile barbershopPic
    ) {
        if (barbershopId == null || barbershopId.isBlank()) {
            return null;
        }
        if (!barbershopId.equals("-1")) {
            // Use existing barbershop
            Long shopId = Long.parseLong(barbershopId);
            return barbershopRepository.findById(shopId)
                    .orElseThrow(() -> new RuntimeException("Barbershop not found"));
        } else {
            // Create new barbershop
            if (barbershopName == null || barbershopName.isBlank()
                    || barbershopAddress == null || barbershopAddress.isBlank()) {
                throw new RuntimeException("Barbershop name/address required for new barbershop");
            }
            Barbershop newShop = new Barbershop();
            newShop.setName(barbershopName);
            newShop.setAddress(barbershopAddress);
            newShop.setRating(0.0);

            // If there's a barbershop picture
            if (barbershopPic != null && !barbershopPic.isEmpty()) {
                String shopPicPath = saveFileToUploads(barbershopPic);
                newShop.setPicture(shopPicPath);
            }
            barbershopRepository.save(newShop);
            return newShop;
        }
    }

    // Helper to store uploaded file in /uploads
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
