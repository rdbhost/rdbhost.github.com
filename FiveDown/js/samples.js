


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
    test: {
        "header": [null, null],
        "rows":   [null,
                  ["======= This sheet can be modified, but not resaved.  Fiddle away", "", "", ""],
                  null,
                  ["Scalar",             "a", "",     [3, 2] ],
                  ["Measurement",        "b", "cm",   [2.02, 3.78] ],
                  null,
                  ["Vector Scalar",      "v0", "",    [[1,2,3], [1,3,1]] ],
                  ["Vector Measurement", "v1", "cm",  [[3.0,2.0,7.8], [4.0,5,8.1]] ],
                  null,
                  ["Multiply",           "m", "",     "a*b"],
                  ["Subtract",           "s", "",     "a-b"],
                  null,
                  ["Dot product is @",   "dp", "",    "v0@v1"],
                  ["Cross product is * (same as multiply)", 
                                         "cp", "",    "v0*v1"],
                  null,
                  ["'in' operator",      "in_", "",    "3.0 in v1"],
                  ["index operator",     "index", "", "v1[0]"],
                  null,
                  ["true / false",       "tru", "",   [true, false]],
                  ["and or ",            "and_or", "", "a or false and tru"],
                  null,

        ]
    }
}


export { samples }