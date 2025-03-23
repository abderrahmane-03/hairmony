package hairmony.controller;

import hairmony.dto.ProfileDTO;
import hairmony.service.ProfileService;
import hairmony.serviceInterfaces.ProfileServiceInf;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileServiceInf profileService;

    @GetMapping("/get/{userId}")
    public ResponseEntity<ProfileDTO> getProfile(@PathVariable Long userId) {
        ProfileDTO dto = profileService.getProfile(userId);
        return ResponseEntity.ok(dto);
    }

    @PutMapping(value = "/update/{userId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProfileDTO> updateProfile(
            @PathVariable Long userId,
            @ModelAttribute ProfileDTO changes // Changed from @RequestBody
    ) {
        ProfileDTO updated = profileService.updateProfile(userId, changes);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/delete/{userId}")
    public ResponseEntity<Void> deleteAccount(@PathVariable Long userId) {
        profileService.deleteAccount(userId);
        return ResponseEntity.noContent().build();
    }
}