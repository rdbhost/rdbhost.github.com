


const samples = {

    geometry: {
        "header": [null],
        "rows":   [null,
                  ["Height","h","cm",[3]],
                  ["Radius","rad","cm",[2.5]],
                  ["Volume of Cylinder","vol","cm^3","h*3.14*rad*rad"],
                  null
        ]
    },
    test: {
        "header": [null, null],
        "rows":   [null,
                  ["======= This Worksheet can be modified, but not resaved.  Fiddle away", "", "", ""],
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
                  ["Cross product is * (same as multiply)", "cp", "", "v0*v1"],
                  null

        ]
    }
}


export { samples }