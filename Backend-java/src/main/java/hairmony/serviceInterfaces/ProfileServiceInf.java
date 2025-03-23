package hairmony.serviceInterfaces;

import hairmony.dto.ProfileDTO;

public interface ProfileServiceInf {
    ProfileDTO getProfile(Long userId);
    ProfileDTO updateProfile(Long userId, ProfileDTO changes);
    void deleteAccount(Long userId);
}