package hairmony.serviceInterfaces;

import hairmony.entities.Haircuts;
import java.util.List;

public interface HaircutServiceInf {
    List<Haircuts> getAllHaircuts();
    Haircuts getHaircutById(Long id);
    List<Haircuts> getHaircutsByFaceShape(String faceShape);
    List<Haircuts> searchHaircuts(String query);
    Haircuts createHaircut(Haircuts haircut);
    Haircuts updateHaircut(Long id, Haircuts haircut);
    void deleteHaircut(Long id);
}