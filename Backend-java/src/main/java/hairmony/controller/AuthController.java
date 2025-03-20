package hairmony.controller;

import hairmony.dto.AuthRequest;
import hairmony.dto.AuthResponse;
import hairmony.entities.*;
import hairmony.repository.BarbershopRepository;
import hairmony.repository.UserRepository;
import hairmony.service.JWTUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BarbershopRepository barbershopRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JWTUtil jwtUtil;

    /**
     * Registration endpoint consuming multipart form-data.
     * Text fields => @RequestParam
     * File fields => @RequestParam(required=false) or @RequestPart
     */
    @PostMapping(
            value = "/register",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public String register(
            @RequestParam("username") String username,
            @RequestParam("password") String password,
            @RequestParam("role") String role,
            @RequestParam(name="picture", required=false) MultipartFile pictureFile,  // user profile picture

            @RequestParam(name="barbershopId", required=false, defaultValue="") String barbershopId,
            @RequestParam(name="barbershopName", required=false) String barbershopName,
            @RequestParam(name="barbershopAddress", required=false) String barbershopAddress,
            @RequestParam(name="barbershopPicture", required=false) MultipartFile barbershopPic
    ) {
        // 1) Check if username is taken
        if (userRepository.findByUsername(username).isPresent()) {
            return "Username already taken!";
        }

        // 2) Encode password
        String encodedPass = passwordEncoder.encode(password);

        // 3) If user uploaded a file, save to disk
        String userPicturePath = null;
        if (pictureFile != null && !pictureFile.isEmpty()) {
            userPicturePath = saveFileToUploads(pictureFile);
        }

        // 4) Build user based on role
        User newUser;
        switch (role.toUpperCase()) {
            case "CLIENT" -> {
                newUser = new Client(username, encodedPass, "CLIENT", userPicturePath, null);
            }
            case "ADMIN" -> {
                newUser = new Admin(username, encodedPass, "ADMIN", userPicturePath);
            }
            case "BARBER" -> {
                // parse barbershopId if present
                // e.g. barbershopId could be "-1" => create new
                Barbershop barbershop = null;

                if (!barbershopId.isEmpty() && !barbershopId.equals("-1")) {
                    // existing barbershop
                    Long shopId = Long.parseLong(barbershopId);
                    barbershop = barbershopRepository.findById(shopId)
                            .orElseThrow(() -> new RuntimeException("Barbershop not found"));
                }
                else if (barbershopId.equals("-1")) {
                    // create new
                    if (barbershopName == null || barbershopName.isBlank() ||
                            barbershopAddress == null || barbershopAddress.isBlank()) {
                        return "Barbershop name and address required for new barbershop!";
                    }
                    barbershop = new Barbershop();
                    barbershop.setName(barbershopName);
                    barbershop.setAddress(barbershopAddress);
                    barbershop.setRating(0.0);

                    // If there's a barbershop picture
                    if (barbershopPic != null && !barbershopPic.isEmpty()) {
                        String shopPicPath = saveFileToUploads(barbershopPic);
                        barbershop.setPicture(shopPicPath);
                    }
                    barbershopRepository.save(barbershop);
                }

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

    /**
     * Helper to store an uploaded file in /uploads
     */
    private String saveFileToUploads(MultipartFile file) {
        try {
            Path uploadsDir = Paths.get("uploads");
            Files.createDirectories(uploadsDir);

            String originalFilename = file.getOriginalFilename();
            String uniqueFilename = UUID.randomUUID() + "_" + originalFilename;

            Path targetPath = uploadsDir.resolve(uniqueFilename).normalize();
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            // Return path (e.g., "uploads/abc123_filename.png")
            return "uploads/" + uniqueFilename;
        } catch (IOException e) {
            throw new RuntimeException("Could not store file. Error: " + e.getMessage());
        }
    }

    // Example login
    @PostMapping("/login")
    public AuthResponse login(@RequestBody AuthRequest request) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow();
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
        return new AuthResponse(token, user.getRole(), user.getId());
    }
}
