package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerRequirementsCreateDto {
    // 1. Cabinet Type (2 fields)
    private Boolean cabinetWpc;
    private Boolean cabinetSs;

    // 2. Door Material (2 fields)
    private Boolean doorWpc;
    private Boolean doorSs;

    // 3. Finish Options (5 fields)
    private Boolean finishGlax;
    private Boolean finishCeramic;
    private Boolean finishGlass;
    private Boolean finishPu;
    private Boolean finishLaminate;

    // 4. Layout Options (7 fields)
    private Boolean layoutLShape;
    private Boolean layoutUShape;
    private Boolean layoutCShape;
    private Boolean layoutGShape;
    private Boolean layoutIsland;
    private Boolean layoutLinear;
    private Boolean layoutParallel;

    // 5. Design Features (4 fields)
    private Boolean designIsland;
    private Boolean designBreakfast;
    private Boolean designBarUnit;
    private Boolean designPantryUnit;

    // 6. Cabinets and Storage (4 fields)
    private Boolean cabinetTallUnits;
    private Boolean cabinetBaseUnits;
    private Boolean cabinetWallUnits;
    private Boolean cabinetLoftUnits;

    // 7. Base Units (4 fields)
    private Boolean baseDrawers;
    private Boolean baseHingeDoors;
    private Boolean basePullouts;
    private Boolean baseWickerBasket;

    // 8. Wall Unit Options (6 fields)
    private Boolean wallUnitImove;
    private Boolean wallHingeDoors;
    private Boolean wallBifoldLiftup;
    private Boolean wallBifoldMotorised;
    private Boolean wallFlapup;
    private Boolean wallRollingShutter;

    // 9. Tall Unit Options (4 fields)
    private Boolean tallUnitPantryPullout;
    private Boolean lavidoPullout;
    private Boolean tallUnitSsShelves;
    private Boolean tallUnitGlassShelf;

    // 10. Handles (6 fields)
    private Boolean handleG;
    private Boolean handleJ;
    private Boolean handleGola;
    private Boolean handleLipProfile;
    private Boolean handleExposeHandless;
    private Boolean inbuiltHandles;

    // 11. Handle Colors (4 fields)
    private Boolean handleColorRoseGold;
    private Boolean handleColorSilver;
    private Boolean handleColorGold;
    private Boolean handleColorBlack;

    // 12. Lighting (1 field)
    private Boolean profileLights;

    // 13. Ovens (2 fields)
    private Boolean ovenBuiltIn;
    private Boolean ovenFreeStanding;

    // 14. Refrigerators (2 fields)
    private Boolean refrigeratorBuiltIn;
    private Boolean refrigeratorFreeStanding;

    // 15. Dishwashers (2 fields)
    private Boolean dishwasherBuiltIn;
    private Boolean dishwasherFreeStanding;

    // 16. Coffee Makers (2 fields)
    private Boolean coffeeMakerBuiltIn;
    private Boolean coffeeMakerFreeStanding;

    // 17. Cook Tops (3 fields)
    private Boolean cookTop90;
    private Boolean cookTop60;
    private Boolean cookTop120;

    // 18. Sinks and Faucets (4 fields)
    private Boolean sinkDoubleBowl;
    private Boolean sinkSingleBowl;
    private Boolean sinkDoubleWithDrain;
    private Boolean sinkMultifunction;

    // 19. Sinks and Faucets Base Unit (6 fields)
    private Boolean sinkBaseDrawers;
    private Boolean sinkBaseDoors;
    private Boolean sinkBaseWasteBin;
    private Boolean sinkBaseDetergentHolder;
    private Boolean sinkBaseDetergentPullouts;
    private Boolean sinkBaseWastebinPullout;

    // 20. Corner Solutions (3 fields)
    private Boolean cornerSolutionLemans;
    private Boolean cornerSolutionMagicCorner;
    private Boolean cornerSolutionShelves;

    // 21. Built-in Sinks (2 fields)
    private Boolean builtInSinkOverCounter;
    private Boolean builtInSinkUnderCounter;

    // 22. Countertops (3 fields)
    private Boolean countertopQuartz;
    private Boolean countertopGranite;
    private Boolean countertopTiles;

    // 23. Timeline (3 fields)
    private Boolean timeline4560Days;
    private Boolean timeline6090Days;
    private Boolean timelineAbove90Days;

    // 24. Text Fields (3 fields)
    private String aestheticsAndColors;
    private String interiorDesigner;
    private String comments;
}


