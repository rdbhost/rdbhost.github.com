


const samples = {

    geometry: {
        "header": [null],
        "rows":   [null,
                  ["Height", "h", "cm", [3]],
                  ["Radius", "rad", "cm", [2.5]],
                  ["Volume of Cylinder","vol", "cm^3", "h*3.14*rad*rad"],
                  null,
                  ["Sphere radius", "rad2", "cm", [5]],
                  ["Volume of sphere", "sphere", "cm^3", "4/3*PI*rad2^3"],
                  null,
                  ["Dog bone volume", "dogbone", "cm^3", "sphere*2+vol"],
                  null,
        ]
    },
    operators: {
        "header": [null, null, null, null, null],
        "rows":   [null,
                  ["======= This sheet can be modified, but not resaved.  Fiddle away", "", "", ""],
                  null,
                  ["First value",             "a", "",     [2, [2,3,4], 3, [1,2,3], true] ],
                  ["Second value",            "b", "cm",   [3.0, [1.0,-1,-2], [5.0,6.1,1], 3, false] ],
                  ["Third value",             "c", "",     [5, true, 4.1, [1,2], false] ],
                  null,
                  ["Multiply",                "m", "",     "a*b"],
                  ["Subtract",                "s", "",     "a-b"],
                  null,
                  ["Dot product is @",        "dp", "",    "a@b"],
                  ["Cross product is * (same as multiply)", 
                                              "cp", "",    "a*b"],
                  null,
                  ["'in' operator",           "in_", "",   "a in b"],
                  ["index operator",          "index", "", "a[b-2]"],
                  null,
                  ["and or ",                 "and_or", "", "(a or false) and b"],
                  null,

        ]
    }
}


export { samples }