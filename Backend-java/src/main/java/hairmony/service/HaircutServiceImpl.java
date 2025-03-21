package hairmony.service;

import hairmony.entities.Haircuts;
import hairmony.exceptions.ResourceNotFoundException;
import hairmony.repository.HaircutRepository;
import hairmony.serviceInterfaces.HaircutServiceInf;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HaircutServiceImpl implements HaircutServiceInf {

    private final HaircutRepository haircutRepository;

    public HaircutServiceImpl(HaircutRepository haircutRepository) {
        this.haircutRepository = haircutRepository;
    }

    @Override
    public List<Haircuts> getAllHaircuts() {
        return haircutRepository.findAll();
    }

    @Override
    public Haircuts getHaircutById(Long id) {
        return haircutRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Haircut not found with id: " + id));
    }

    @Override
    public List<Haircuts> getHaircutsByFaceShape(String faceShape) {
        return haircutRepository.findByFaceShape(faceShape);
    }

    @Override
    public List<Haircuts> searchHaircuts(String query) {
        return haircutRepository.findByNameContainingIgnoreCase(query);
    }

    @Override
    public Haircuts createHaircut(Haircuts haircut) {
        return haircutRepository.save(haircut);
    }

    @Override
    public Haircuts updateHaircut(Long id, Haircuts haircutDetails) {
        Haircuts haircut = getHaircutById(id);
        haircut.setName(haircutDetails.getName());
        haircut.setDescription(haircutDetails.getDescription());
        haircut.setPrice(haircutDetails.getPrice());
        haircut.setFaceShape(haircutDetails.getFaceShape());
        haircut.setImageUrl(haircutDetails.getImageUrl());
        return haircutRepository.save(haircut);
    }

    @Override
    public void deleteHaircut(Long id) {
        Haircuts haircut = getHaircutById(id);
        haircutRepository.delete(haircut);
    }
}