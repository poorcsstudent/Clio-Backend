export interface CampusPlace {
  id: string;
  campusId: string;
  name: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  sourceUrl: string;
  address?: string;
  aliases?: string[];
}

export const campusPlaceMetadata = {
  lastVerified: "2026-07-21",
  sources: [
    "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--",
    "https://calendar.mst.edu/",
  ],
} as const;

export const campusPlaces: CampusPlace[] = [
  {
    "id": "1200-n-pine-st",
    "campusId": "missouri-s-and-t",
    "name": "1200 N. Pine St.",
    "category": "Campus and Student Support",
    "description": "Missouri S&T's campus map lists 1200 N. Pine St. as campus and student support.",
    "latitude": 37.95343601003529,
    "longitude": -91.7711343090125,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--",
    "aliases": [
      "1200 N, Pine St."
    ]
  },
  {
    "id": "1303-n-elm-st",
    "campusId": "missouri-s-and-t",
    "name": "1303 N. Elm St.",
    "category": "Student Housing",
    "description": "Residential townhouses for students.",
    "latitude": 37.954485537082086,
    "longitude": -91.7708010959441,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--",
    "aliases": [
      "1303 N Elm St."
    ]
  },
  {
    "id": "209-e-8th-st",
    "campusId": "missouri-s-and-t",
    "name": "209 E. 8th St.",
    "category": "Campus and Student Support",
    "description": "Missouri S&T's campus map lists 209 E. 8th St. as campus and student support.",
    "latitude": 37.95028988971014,
    "longitude": -91.76895415292361,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--"
  },
  {
    "id": "720-w-tim-bradley-way",
    "campusId": "missouri-s-and-t",
    "name": "720 W. Tim Bradley Way",
    "category": "Campus and Student Support",
    "description": "Houses research labs and the Missouri Local Training and Resource Center (MLTRC) which is the home to both the LTAP and RTAP programs.",
    "latitude": 37.955694783282894,
    "longitude": -91.7782317471166,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--"
  },
  {
    "id": "800-w-tim-bradley-way",
    "campusId": "missouri-s-and-t",
    "name": "800 W. Tim Bradley Way",
    "category": "Campus and Student Support",
    "description": "Missouri S&T's campus map lists 800 W. Tim Bradley Way as campus and student support.",
    "latitude": 37.95555840115155,
    "longitude": -91.77868478885779,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--"
  },
  {
    "id": "allgood-bailey-stadium",
    "campusId": "missouri-s-and-t",
    "name": "Allgood-Bailey Stadium",
    "category": "Campus and Student Support",
    "description": "Home of the Missouri S&T football, soccer and track and field teams, and host to the annual Dewey Allgood Invitational track and field meet.",
    "latitude": 37.950254295087475,
    "longitude": -91.78093601960121,
    "sourceUrl": "https://calendar.mst.edu/allgood-bailey_stadium_451",
    "address": "903 W. 10th St., Rolla, MO 65401"
  },
  {
    "id": "altman-hall",
    "campusId": "missouri-s-and-t",
    "name": "Altman Hall",
    "category": "Campus and Student Support",
    "description": "Home to a number of student organizations, including KMNR 89.7, our student-run, free-format college radio station; the Missouri Miner, our weekly, student-run newspaper; and RollaMo, our student-led yearbook. The building is also home to SPECTRUM, a campus organization that provides support for people of all sexual orientations and gender identities, as well as the Residential Life Downtown Campus office.",
    "latitude": 37.95124119260115,
    "longitude": -91.77544006101085,
    "sourceUrl": "https://calendar.mst.edu/altman_hall_629",
    "address": "601 W. 10th St., Rolla, MO 65401"
  },
  {
    "id": "athletic-fields",
    "campusId": "missouri-s-and-t",
    "name": "Athletic Fields",
    "category": "Campus and Student Support",
    "description": "Missouri S&T's campus map lists Athletic Fields as campus and student support.",
    "latitude": 37.94915611525269,
    "longitude": -91.77874010368517,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--"
  },
  {
    "id": "bertelsmeyer-hall",
    "campusId": "missouri-s-and-t",
    "name": "Bertelsmeyer Hall",
    "category": "Classrooms and Labs",
    "description": "Missouri S&T's campus map lists Bertelsmeyer Hall as classrooms and labs.",
    "latitude": 37.95264787504493,
    "longitude": -91.77579659817978,
    "sourceUrl": "https://calendar.mst.edu/james_e_bertelsmeyer_hall_842",
    "address": "1101 North State Street, Rolla, MO 65409"
  },
  {
    "id": "butler-carlton-civil-engineering-hall",
    "campusId": "missouri-s-and-t",
    "name": "Butler-Carlton Civil Engineering Hall",
    "category": "Classrooms and Labs",
    "description": "Home to our Civil, Architectural and Environmental Engineering Department, Geotechnical Engineering Program and Environmental Research Center.",
    "latitude": 37.95554837587574,
    "longitude": -91.77201516921404,
    "sourceUrl": "https://calendar.mst.edu/butler-carlton_civil_engineering_hall_183",
    "address": "1401 N. Pine St., Rolla, MO 65409",
    "aliases": [
      "Butler Carlton Hall",
      "Civil Engineering Building"
    ]
  },
  {
    "id": "castleman-hall",
    "campusId": "missouri-s-and-t",
    "name": "Castleman Hall",
    "category": "Campus and Student Support",
    "description": "Home to Leach Theatre and the Black Box Theatre; our art and film, music, and theatre programs; and our development office.",
    "latitude": 37.95191208518472,
    "longitude": -91.77418503186003,
    "sourceUrl": "https://calendar.mst.edu/castleman_hall_905",
    "address": "400 W. 10th St., Rolla, MO 65409"
  },
  {
    "id": "centennial-hall",
    "campusId": "missouri-s-and-t",
    "name": "Centennial Hall",
    "category": "Campus and Student Support",
    "description": "A number of needs-based service departments, including Human Resources and New Student Programs, are based out of this building. It is also home to globally-focused academic departments such as Distance and Continuing Education, Global Learning, Global and Strategic Partnerships, and Sponsored Programs.",
    "latitude": 37.953011713699986,
    "longitude": -91.77313495500451,
    "sourceUrl": "https://calendar.mst.edu/centennial_hall_963",
    "address": "300 W. 12th St., Rolla, MO 65409"
  },
  {
    "id": "chancellor-s-residence",
    "campusId": "missouri-s-and-t",
    "name": "Chancellor's Residence",
    "category": "Campus Landmark",
    "description": "Originally the first residence hall on campus, this building is also the second-oldest building, after the Rolla Building.",
    "latitude": 37.95262727388301,
    "longitude": -91.77470460231108,
    "sourceUrl": "https://calendar.mst.edu/chancellors_residence_711",
    "address": "506 W. 11th St., Rolla, MO 65409"
  },
  {
    "id": "child-development-center",
    "campusId": "missouri-s-and-t",
    "name": "Child Development Center",
    "category": "Campus and Student Support",
    "description": "This state-licensed, curriculum-based facility welcomes children of faculty, staff, and students of Missouri S&T, as well as community members. We offer full time care for students ages 6 weeks to 5 years old, along with before & after school care for students up to the age of 8.",
    "latitude": 37.95377736362418,
    "longitude": -91.77078938582439,
    "sourceUrl": "https://calendar.mst.edu/child_development_center",
    "address": "1207 North Elm St., Rolla, MO 65409-1150"
  },
  {
    "id": "compressible-flow-laboratory",
    "campusId": "missouri-s-and-t",
    "name": "Compressible Flow Laboratory",
    "category": "Research and Support Facilities",
    "description": "Missouri S&T's campus map lists Compressible Flow Laboratory as research and support facilities.",
    "latitude": 37.958491443405606,
    "longitude": -91.78198251582555,
    "sourceUrl": "https://calendar.mst.edu/compressible_flow_laboratory_420",
    "address": "1001 Collegiate Blvd., Rolla, MO 65409"
  },
  {
    "id": "computer-science-building",
    "campusId": "missouri-s-and-t",
    "name": "Computer Science Building",
    "category": "Classrooms and Labs",
    "description": "Home to our Computer Science Department and Information Technology Services.",
    "latitude": 37.95591160630769,
    "longitude": -91.77463592273608,
    "sourceUrl": "https://calendar.mst.edu/computer_science_building_731",
    "address": "500 W. 15th St., Rolla, MO 65409",
    "aliases": [
      "Computer Science Department",
      "CS Building"
    ]
  },
  {
    "id": "curtis-laws-wilson-library",
    "campusId": "missouri-s-and-t",
    "name": "Curtis Laws Wilson Library",
    "category": "Research and Support Facilities",
    "description": "Houses a resource center providing access to books, articles, and various materials, the IT Helpdesk, and the Center for Advancing Faculty Excellence.",
    "latitude": 37.95560479566568,
    "longitude": -91.77349870705616,
    "sourceUrl": "https://calendar.mst.edu/curtis_laws_wilson_library_92",
    "address": "400 W. 14th St., Rolla, MO 65409",
    "aliases": [
      "Campus Library",
      "Wilson Library"
    ]
  },
  {
    "id": "custodial-and-landscape-services-building",
    "campusId": "missouri-s-and-t",
    "name": "Custodial and Landscape Services Building",
    "category": "Campus and Student Support",
    "description": "This building houses custodial and landscape equipment to keep our campus grounds green and clean.",
    "latitude": 37.953013532549754,
    "longitude": -91.77079417314384,
    "sourceUrl": "https://calendar.mst.edu/custodial_and_landscape_services_building_266",
    "address": "101 W. 12th St., Rolla, MO 65401"
  },
  {
    "id": "ecovillage",
    "campusId": "missouri-s-and-t",
    "name": "EcoVillage",
    "category": "Campus Landmark",
    "description": "Experimental village featuring two solar houses built by our Solar House Team. Each house is available for students to rent, based on timing.",
    "latitude": 37.950941165945785,
    "longitude": -91.78295724972637,
    "sourceUrl": "https://calendar.mst.edu/eco_village_923",
    "address": "910 Innovation Drive, Rolla, MO 65401"
  },
  {
    "id": "emerson-electric-company-hall",
    "campusId": "missouri-s-and-t",
    "name": "Emerson Electric Company Hall",
    "category": "Classrooms and Labs",
    "description": "Missouri S&T's campus map lists Emerson Electric Company Hall as classrooms and labs.",
    "latitude": 37.956144342651776,
    "longitude": -91.77298451337103,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--",
    "aliases": [
      "ECE",
      "Electrical and Computer Engineering",
      "Emerson Hall"
    ]
  },
  {
    "id": "engineering-management-building",
    "campusId": "missouri-s-and-t",
    "name": "Engineering Management Building",
    "category": "Classrooms and Labs",
    "description": "Home to our Engineering Management and Systems Engineering Department.",
    "latitude": 37.955315796221875,
    "longitude": -91.77509651804023,
    "sourceUrl": "https://calendar.mst.edu/engineering_management_building_834",
    "address": "600 W. 14th St., Rolla, MO 65409-0370",
    "aliases": [
      "Engineering Management",
      "Systems Engineering"
    ]
  },
  {
    "id": "engineering-research-laboratory",
    "campusId": "missouri-s-and-t",
    "name": "Engineering Research Laboratory",
    "category": "Research and Support Facilities",
    "description": "A wide range of engineering research is conducted in this building, including a research partnership with the Missouri Department of Transportation.",
    "latitude": 37.95664974953066,
    "longitude": -91.77456976580964,
    "sourceUrl": "https://calendar.mst.edu/engineering_research_laboratory_408",
    "address": "500 W. 16th St., Rolla, MO 65409"
  },
  {
    "id": "farrar-hall",
    "campusId": "missouri-s-and-t",
    "name": "Farrar Hall",
    "category": "Campus and Student Support",
    "description": "Missouri S&T's campus map lists Farrar Hall as campus and student support.",
    "latitude": 37.9509112846284,
    "longitude": -91.77566599346044,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--"
  },
  {
    "id": "fitness-center",
    "campusId": "missouri-s-and-t",
    "name": "Fitness Center",
    "category": "Campus and Student Support",
    "description": "Free for all actively enrolled students with a valid S&T ID card, and available to faculty and staff for a small monthly fee, our fitness center features treadmills, steppers, bikes, spinners, ellipticals, weight machines, free weights and medicine balls.",
    "latitude": 37.95072743546277,
    "longitude": -91.77879222286809,
    "sourceUrl": "https://calendar.mst.edu/fitness_center_218",
    "address": "705 W. 10th St., Rolla, MO, 65409"
  },
  {
    "id": "fulton-hall",
    "campusId": "missouri-s-and-t",
    "name": "Fulton Hall",
    "category": "Classrooms and Labs",
    "description": "Houses the College of Arts, Sciences, and Business, and business and information technology.",
    "latitude": 37.95493351742507,
    "longitude": -91.77301149693155,
    "sourceUrl": "https://calendar.mst.edu/fulton_hall_623",
    "address": "301 W. 14th St., Rolla, MO, 65409"
  },
  {
    "id": "gale-bullman-building",
    "campusId": "missouri-s-and-t",
    "name": "Gale Bullman Building",
    "category": "Campus and Student Support",
    "description": "A number of campus-wide events are held in this building, including our Career Fair, which is one of the biggest in the Midwest and takes place every semester, and both the spring and winter commencement ceremonies. The building is also the home of our women's volleyball, and men and women's basketball teams, which play between the bleachers on Billy Key Court.",
    "latitude": 37.950931847676635,
    "longitude": -91.77814239328401,
    "sourceUrl": "https://calendar.mst.edu/gale_bullman_building_653",
    "address": "705 W. 10th St., Rolla, MO, 65409"
  },
  {
    "id": "general-services-building",
    "campusId": "missouri-s-and-t",
    "name": "General Services Building",
    "category": "Campus and Student Support",
    "description": "Home to our facilities operations.",
    "latitude": 37.95834419931218,
    "longitude": -91.78793001240027,
    "sourceUrl": "https://calendar.mst.edu/general_services_building_380",
    "address": "1701 Spruce Drive., Rolla, MO 65409"
  },
  {
    "id": "harris-hall",
    "campusId": "missouri-s-and-t",
    "name": "Harris Hall",
    "category": "Classrooms and Labs",
    "description": "Houses the AirForce and Army ROTC programs and economics.",
    "latitude": 37.95459004546547,
    "longitude": -91.77463495196812,
    "sourceUrl": "https://calendar.mst.edu/harris_hall_365",
    "address": "500 W. 13th St., Rolla, MO, 65409"
  },
  {
    "id": "hasselmann-alumni-house",
    "campusId": "missouri-s-and-t",
    "name": "Hasselmann Alumni House",
    "category": "Campus and Student Support",
    "description": "Our alumni's home on campus, this building hosts alumni, donor, faculty, staff and student events, and is also home to our Miner Alumni Association staff and advacement services department.",
    "latitude": 37.95256643144971,
    "longitude": -91.7711215757835,
    "sourceUrl": "https://calendar.mst.edu/hasselmann_alumni_house_272",
    "address": "1200 N. Pine St., Rolla, MO 65409"
  },
  {
    "id": "havener-center",
    "campusId": "missouri-s-and-t",
    "name": "Havener Center",
    "category": "Campus and Student Support",
    "description": "The center of campus, this building features conference rooms and event space, a number of dining options, a student lounge, and the S&T Store. Over 5,000 student, faculty, staff, alumni, donor and corporate events are held here every year.",
    "latitude": 37.954821574023576,
    "longitude": -91.77634294571274,
    "sourceUrl": "https://calendar.mst.edu/havener-center",
    "address": "1346 N. Bishop Ave., Rolla, MO 65401",
    "aliases": [
      "Food Court",
      "Havener",
      "S&T Store",
      "Student Center"
    ]
  },
  {
    "id": "humanities-and-social-sciences-building",
    "campusId": "missouri-s-and-t",
    "name": "Humanities and Social Sciences Building",
    "category": "Classrooms and Labs",
    "description": "Home to our Arts, Languages and Philosophy Department, English and Technical Communication Department, History and Political Science Department, and Psychological Science Department.",
    "latitude": 37.95531916831647,
    "longitude": -91.77423632173252,
    "sourceUrl": "https://calendar.mst.edu/humanities_and_social_sciences_building_550",
    "address": "500 W. 14th St., Rolla, MO 65409",
    "aliases": [
      "Humanities and Social Science Building"
    ]
  },
  {
    "id": "innovation-lab",
    "campusId": "missouri-s-and-t",
    "name": "Innovation Lab",
    "category": "Campus and Student Support",
    "description": "The Innovation Lab is a dynamic space designed to nurture creativity, collaboration, and discovery among our students. With a vision to shape the future of education and innovation, we invite you to explore this groundbreaking facility and be a part of our journey towards excellence.",
    "latitude": 37.954178312766594,
    "longitude": -91.77601182948283,
    "sourceUrl": "https://calendar.mst.edu/innovation-lab-768",
    "address": "650 Tim Bradley Way, Rolla, MO 65401",
    "aliases": [
      "IL",
      "Makers Studio",
      "Student Success Center"
    ]
  },
  {
    "id": "interdisciplinary-engineering-building",
    "campusId": "missouri-s-and-t",
    "name": "Interdisciplinary Engineering Building",
    "category": "Classrooms and Labs",
    "description": "Houses 3 classrooms, the biology department, and the Center for Synthetic Organic Electrochemistry and the O’Keefe Center for Critical Minerals.",
    "latitude": 37.953952651240755,
    "longitude": -91.77212405582456,
    "sourceUrl": "https://calendar.mst.edu/interdisciplinary_engineering_building_846",
    "address": "1215 N. Pine St., Rolla, MO 65409"
  },
  {
    "id": "jack-carney-puck-and-plaza",
    "campusId": "missouri-s-and-t",
    "name": "Jack Carney Puck and Plaza",
    "category": "Campus Landmark",
    "description": "Missouri S&T's campus map lists Jack Carney Puck and Plaza as campus landmark.",
    "latitude": 37.95378133701271,
    "longitude": -91.77353329280012,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--",
    "aliases": [
      "Puck and Plaza",
      "The Puck"
    ]
  },
  {
    "id": "kennedy-experimental-mine",
    "campusId": "missouri-s-and-t",
    "name": "Kennedy Experimental Mine",
    "category": "Research and Support Facilities",
    "description": "Missouri S&T's campus map lists Kennedy Experimental Mine as research and support facilities.",
    "latitude": 37.936993225035145,
    "longitude": -91.79127636038487,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--"
  },
  {
    "id": "kummer-student-design-center",
    "campusId": "missouri-s-and-t",
    "name": "Kummer Student Design Center",
    "category": "Campus and Student Support",
    "description": "Our 14 student design teams spend a good deal of time planning, building and working on projects in this facility, which offers 24-7 access and features advanced computer design labs and software, a complete manufacturing and testing center, business offices, and logistical assets.",
    "latitude": 37.951764395574905,
    "longitude": -91.7779722872522,
    "sourceUrl": "https://calendar.mst.edu/kummer_student_design_center_703",
    "address": "1051 N. Bishop Ave., Rolla, MO 65409",
    "aliases": [
      "Kummer Design Center",
      "Student Design Center"
    ]
  },
  {
    "id": "mcnutt-hall",
    "campusId": "missouri-s-and-t",
    "name": "McNutt Hall",
    "category": "Classrooms and Labs",
    "description": "Home to our Geosciences and Geological and Petroleum Engineering Department; Materials Science and Engineering Department, Mining Engineering Department; Freshman Engineering Program; and Energy Research and Development Center, which serves as a focal point for energy-related research, development and deployment.",
    "latitude": 37.95583372576494,
    "longitude": -91.77607760819943,
    "sourceUrl": "https://calendar.mst.edu/mcnutt_hall_463",
    "address": "1400 N. Bishop, Rolla, MO 65409-0330",
    "aliases": [
      "V.H. McNutt Hall",
      "Vachel H. McNutt Hall"
    ]
  },
  {
    "id": "millennium-arch",
    "campusId": "missouri-s-and-t",
    "name": "Millennium Arch",
    "category": "Campus Landmark",
    "description": "Missouri S&T's campus map lists Millennium Arch as campus landmark.",
    "latitude": 37.95173314084612,
    "longitude": -91.77482426259621,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--",
    "aliases": [
      "Milinennium Arch"
    ]
  },
  {
    "id": "miner-dome-indoor-practice-facility",
    "campusId": "missouri-s-and-t",
    "name": "Miner Dome Indoor Practice Facility",
    "category": "Campus and Student Support",
    "description": "Indoor practice facility for Miner sports teams, including baseball, softball and track and field.",
    "latitude": 37.94972115087919,
    "longitude": -91.77875914244872,
    "sourceUrl": "https://calendar.mst.edu/miner_dome_indoor_practice_facility_946",
    "address": "801 W. 10th St., Rolla, MO 65409"
  },
  {
    "id": "miner-village",
    "campusId": "missouri-s-and-t",
    "name": "Miner Village",
    "category": "Student Housing",
    "description": "Missouri S&T's campus map lists Miner Village as student housing.",
    "latitude": 37.95934353608598,
    "longitude": -91.7800442724626,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--"
  },
  {
    "id": "missouri-protoplex",
    "campusId": "missouri-s-and-t",
    "name": "Missouri Protoplex",
    "category": "Research and Support Facilities",
    "description": "Missouri S&T's campus map lists Missouri Protoplex as research and support facilities.",
    "latitude": 37.95767234064768,
    "longitude": -91.78080760033816,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--",
    "aliases": [
      "Missouri Protplex",
      "Protoplex"
    ]
  },
  {
    "id": "mstr",
    "campusId": "missouri-s-and-t",
    "name": "MSTR",
    "category": "Research and Support Facilities",
    "description": "Missouri S&T's campus map lists MSTR as research and support facilities.",
    "latitude": 37.95454879054087,
    "longitude": -91.77245358898021,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--"
  },
  {
    "id": "norwood-hall",
    "campusId": "missouri-s-and-t",
    "name": "Norwood Hall",
    "category": "Campus and Student Support",
    "description": "Home to a number of student services, including Division of Student Success; New Student Programs; Career Opportunities and Employer Relations; Student Well-Being; and the Visitor Center.",
    "latitude": 37.95368252871673,
    "longitude": -91.77284322073164,
    "sourceUrl": "https://calendar.mst.edu/norwood_hall_122",
    "address": "320 W. 12th St., Rolla, MO 65409",
    "aliases": [
      "Career Opportunities and Employer Relations",
      "COER",
      "Student Success"
    ]
  },
  {
    "id": "parker-hall",
    "campusId": "missouri-s-and-t",
    "name": "Parker Hall",
    "category": "Campus and Student Support",
    "description": "A starting point for new or prospective students, this building features our Visitor Center, Admissions Office, Registrar, Student Financial Assistance, Accounting and Cashier's Office, and administrative offices.",
    "latitude": 37.95438479341443,
    "longitude": -91.7731011778556,
    "sourceUrl": "https://calendar.mst.edu/parker_hall_373",
    "address": "300 W. 13th St., Rolla, MO 65409",
    "aliases": [
      "Admissions",
      "Financial Aid",
      "Registrar"
    ]
  },
  {
    "id": "pedestrian-bridge",
    "campusId": "missouri-s-and-t",
    "name": "Pedestrian Bridge",
    "category": "Campus Landmark",
    "description": "Missouri S&T's campus map lists Pedestrian Bridge as campus landmark.",
    "latitude": 37.95623423651583,
    "longitude": -91.78189677968608,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--"
  },
  {
    "id": "phelps-health-annex",
    "campusId": "missouri-s-and-t",
    "name": "Phelps Health Annex",
    "category": "Campus and Student Support",
    "description": "Missouri S&T's campus map lists Phelps Health Annex as campus and student support.",
    "latitude": 37.95192428035252,
    "longitude": -91.78729772005624,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--"
  },
  {
    "id": "physics-building",
    "campusId": "missouri-s-and-t",
    "name": "Physics Building",
    "category": "Classrooms and Labs",
    "description": "Home to our Physics Department.",
    "latitude": 37.954962369568825,
    "longitude": -91.7719552081252,
    "sourceUrl": "https://calendar.mst.edu/physics_building_456",
    "address": "1315 N. Pine St. , Rolla, MO 65409"
  },
  {
    "id": "pine-building",
    "campusId": "missouri-s-and-t",
    "name": "Pine Building",
    "category": "Classrooms and Labs",
    "description": "Missouri S&T's campus map lists Pine Building as classrooms and labs.",
    "latitude": 37.9545583761206,
    "longitude": -91.77116478624828,
    "sourceUrl": "https://calendar.mst.edu/pine_building_934",
    "address": "1304 N. Pine St., Rolla, MO 65409"
  },
  {
    "id": "residential-commons-1",
    "campusId": "missouri-s-and-t",
    "name": "Residential Commons 1",
    "category": "Student Housing",
    "description": "Missouri S&T's campus map lists Residential Commons 1 as student housing.",
    "latitude": 37.9556228202308,
    "longitude": -91.77749401130475,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--",
    "aliases": [
      "RC1",
      "Residential College 1"
    ]
  },
  {
    "id": "residential-commons-2",
    "campusId": "missouri-s-and-t",
    "name": "Residential Commons 2",
    "category": "Student Housing",
    "description": "Suite-style residence hall with double suites, double-deluxe suites, and single-deluxe suites, all with semi-private bathrooms. Each floor includes a study lounge, common lounge, and kitchen.",
    "latitude": 37.95635670044151,
    "longitude": -91.77746166979895,
    "sourceUrl": "https://calendar.mst.edu/residential_commons_2_828",
    "address": "1575 Watts Drive, Rolla, MO 65401",
    "aliases": [
      "RC2",
      "Residential College 2"
    ]
  },
  {
    "id": "rock-mechanics-and-explosives-research-center",
    "campusId": "missouri-s-and-t",
    "name": "Rock Mechanics and Explosives Research Center",
    "category": "Research and Support Facilities",
    "description": "Missouri S&T's campus map lists Rock Mechanics and Explosives Research Center as research and support facilities.",
    "latitude": 37.947189934949456,
    "longitude": -91.77923302678477,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--"
  },
  {
    "id": "rolla-building",
    "campusId": "missouri-s-and-t",
    "name": "Rolla Building",
    "category": "Classrooms and Labs",
    "description": "Home to our Mathematics and Statistics Department, this is the oldest academic building on campus.",
    "latitude": 37.95354861313933,
    "longitude": -91.77413321448516,
    "sourceUrl": "https://calendar.mst.edu/rolla_building_927",
    "address": "400 W. 12th St., Rolla, MO 65409-0020",
    "aliases": [
      "Mathematics and Statistics Building"
    ]
  },
  {
    "id": "rolla-suites-building-1",
    "campusId": "missouri-s-and-t",
    "name": "Rolla Suites Building 1",
    "category": "Student Housing",
    "description": "Missouri S&T's campus map lists Rolla Suites Building 1 as student housing.",
    "latitude": 37.95273601909866,
    "longitude": -91.77228126180596,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--"
  },
  {
    "id": "rolla-suites-building-2",
    "campusId": "missouri-s-and-t",
    "name": "Rolla Suites Building 2",
    "category": "Student Housing",
    "description": "Missouri S&T's campus map lists Rolla Suites Building 2 as student housing.",
    "latitude": 37.952615921061195,
    "longitude": -91.77232667270192,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--"
  },
  {
    "id": "schrenk-hall",
    "campusId": "missouri-s-and-t",
    "name": "Schrenk Hall",
    "category": "Classrooms and Labs",
    "description": "Home to our Chemistry Department and Biological Sciences Department, this building features a number of laboratories, including the Solid State Nuclear Magnetic Resonance Laboratory, and Microbiological Prep Room, Vivarium, and Imaging Center.",
    "latitude": 37.95287205498949,
    "longitude": -91.77416178616573,
    "sourceUrl": "https://calendar.mst.edu/schrenk_hall_325",
    "address": "400 W. 11th St., Rolla, MO 65409"
  },
  {
    "id": "solar-village",
    "campusId": "missouri-s-and-t",
    "name": "Solar Village",
    "category": "Campus Landmark",
    "description": "Experimental village featuring four solar houses built by our Solar House Team, and powered by a microgrid. Each house is available for students to rent, based on timing.",
    "latitude": 37.95174260554185,
    "longitude": -91.77992708083588,
    "sourceUrl": "https://calendar.mst.edu/solar_village_463",
    "address": "808 W. 10 St., Rolla, MO 65401"
  },
  {
    "id": "stonehenge",
    "campusId": "missouri-s-and-t",
    "name": "Stonehenge",
    "category": "Campus Landmark",
    "description": "Missouri S&T's campus map lists Stonehenge as campus landmark.",
    "latitude": 37.95635620698575,
    "longitude": -91.77654952745289,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--"
  },
  {
    "id": "straumanis-james-hall",
    "campusId": "missouri-s-and-t",
    "name": "Straumanis-James Hall",
    "category": "Research and Support Facilities",
    "description": "Houses the graduate center for materials research.",
    "latitude": 37.95633360756195,
    "longitude": -91.77409310608702,
    "sourceUrl": "https://calendar.mst.edu/straumanis-james_hall_870",
    "address": "401 W. 16th St., Rolla, MO 65409"
  },
  {
    "id": "student-health-complex",
    "campusId": "missouri-s-and-t",
    "name": "Student Health Complex",
    "category": "Campus and Student Support",
    "description": "Home to our Student Health Services, a resource for students seeking health and medical services such as immunizations, STD testing, physicals, and allergy injections.",
    "latitude": 37.9517244762152,
    "longitude": -91.78105958813548,
    "sourceUrl": "https://calendar.mst.edu/student_health_complex_894",
    "address": "910 W. 10th St., Rolla, MO, 65409",
    "aliases": [
      "Student Health Center",
      "Student Health Services",
      "Campus Health Center"
    ]
  },
  {
    "id": "student-recreation-center",
    "campusId": "missouri-s-and-t",
    "name": "Student Recreation Center",
    "category": "Campus and Student Support",
    "description": "State-of-the-art facility that has three basketball/volleyball/badminton courts, four racquetball courts, a squash court, an aerobics room, and a three-lane track, all indoors.",
    "latitude": 37.95110577117284,
    "longitude": -91.77881455074842,
    "sourceUrl": "https://calendar.mst.edu/student_recreation_center_144",
    "address": "705 W. 10th St., Rolla, MO, 65409"
  },
  {
    "id": "technology-development-center",
    "campusId": "missouri-s-and-t",
    "name": "Technology Development Center",
    "category": "Research and Support Facilities",
    "description": "Facility that provides Class A office suites and shared office space for a variety of clients, particularly technology-oriented tenants. The center is located at Innovation Park, our designated research park.",
    "latitude": 37.95089558447298,
    "longitude": -91.78445234595479,
    "sourceUrl": "https://calendar.mst.edu/technology_development_center_29",
    "address": "900 Innovation Drive, Rolla, MO 65401",
    "aliases": [
      "Technology Developement Center"
    ]
  },
  {
    "id": "temporary-research-facility",
    "campusId": "missouri-s-and-t",
    "name": "Temporary Research Facility",
    "category": "Research and Support Facilities",
    "description": "Missouri S&T's campus map lists Temporary Research Facility as research and support facilities.",
    "latitude": 37.95824134277438,
    "longitude": -91.7806497450649,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--"
  },
  {
    "id": "the-engagement-house",
    "campusId": "missouri-s-and-t",
    "name": "The Engagement House",
    "category": "Campus and Student Support",
    "description": "Missouri S&T's campus map lists The Engagement House as campus and student support.",
    "latitude": 37.95203331816771,
    "longitude": -91.77586016110297,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--"
  },
  {
    "id": "thomas-jefferson-residence-hall",
    "campusId": "missouri-s-and-t",
    "name": "Thomas Jefferson Residence Hall",
    "category": "Student Housing",
    "description": "A two-tower residential life housing complex. All rooms have air conditionaing, heat, Ethernet (Internet) service and cable television. The housing complex is also host to our Voyager and Holistic Communites. Select floors are designated as Quiet Floors for those who need a little less volume.",
    "latitude": 37.95988676206735,
    "longitude": -91.77161151022156,
    "sourceUrl": "https://calendar.mst.edu/thomas_jefferson_residence_hall_851",
    "address": "202 W. 18th St., Rolla, MO 65401",
    "aliases": [
      "Thomas Jefferson Hall",
      "TJ Hall"
    ]
  },
  {
    "id": "toomey-hall",
    "campusId": "missouri-s-and-t",
    "name": "Toomey Hall",
    "category": "Classrooms and Labs",
    "description": "Home to our Mechanical and Aerospace Engineering Department and Manufacturing Engineering Department, this building features a number of state-of-the-art laboratories in advanced manufacturing, aerospace, energy, materials and structures, micro/nano systems, and robotics and vehicle systems. This building is also home to our Burns & McDonnell Student Success Center, which gives students a place to relax on campus and includes computers, printers and other services.",
    "latitude": 37.95444585587784,
    "longitude": -91.77401481023583,
    "sourceUrl": "https://calendar.mst.edu/toomey_hall_618",
    "address": "400 W. 13th St., Rolla, MO 65409"
  },
  {
    "id": "university-commons",
    "campusId": "missouri-s-and-t",
    "name": "University Commons",
    "category": "Student Housing",
    "description": "Apartment-style residence hall that houses students in primarily eight-person apartments. Each apartment has four bedrooms, a living room, full kitchen and two bathrooms. The building also utilizes the latest security technology by providing access to rooms only through valid student ID cards.",
    "latitude": 37.95577767462789,
    "longitude": -91.77941585852683,
    "sourceUrl": "https://calendar.mst.edu/university_commons_771",
    "address": "850 University Drive, Rolla, MO 65409"
  },
  {
    "id": "university-police",
    "campusId": "missouri-s-and-t",
    "name": "University Police",
    "category": "Campus and Student Support",
    "description": "Missouri S&T's campus map lists University Police as campus and student support.",
    "latitude": 37.953030411822766,
    "longitude": -91.77190709669013,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--"
  },
  {
    "id": "visitor-parking",
    "campusId": "missouri-s-and-t",
    "name": "Visitor Parking",
    "category": "Visitor Parking",
    "description": "Missouri S&T's campus map lists Visitor Parking as visitor parking.",
    "latitude": 37.95330845031844,
    "longitude": -91.77605846534752,
    "sourceUrl": "https://experience.arcgis.com/experience/c56eca7372d64f0ebf87d8b1084aa5b9/page/Main-Campus-2?views=Buildings-%26-Landmarks--"
  },
  {
    "id": "welcome-center",
    "campusId": "missouri-s-and-t",
    "name": "Welcome Center",
    "category": "Welcome Center",
    "description": "This 32,000-square-foot facility provides an inviting campus experience to future students and their families.",
    "latitude": 37.95422584487109,
    "longitude": -91.774726661694,
    "sourceUrl": "https://calendar.mst.edu/welcome-center",
    "address": "500 Tim Bradley Way, Rolla MO, 65401"
  }
];
