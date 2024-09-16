/*  Provides a default Map of available functions

*/

import { unit } from './unit-math.js'

const FunctionMap = new Map([

    ['sin', Math.sin],
    ['cos', Math.cos],
    ['tan', Math.tan],
    ['acos', Math.acos],
    ['asin', Math.asin],
    ['atan', Math.atan],
    
    ['cosh', Math.cosh],
    ['sinh', Math.sinh],
    ['tanh', Math.tanh],
    ['acosh', Math.acosh],
    ['asinh', Math.asinh],
    ['atanh', Math.atanh],
    
    ['degrees', (r) => r*180/Math.PI],
    ['radians', (d) => d*Math.PI/180],
    
    ['round', Math.round],
    ['ceil', Math.ceil],
    ['floor', Math.floor],
    ['fround', Math.fround],
    ['trunc', Math.trunc],
    
    ['sqrt', Math.sqrt],
    ['pow', Math.pow],
    ['imul', Math.imul],

    ['mag', Math.hypot], // measures magnitude of vector
    
    ['ln', Math.log],
    ['log10', Math.log10],
    ['log2', Math.log2],
    ['exp', Math.exp],
    
    ['max', Math.max],
    ['min', Math.min],
    ['random', Math.random],
    ['abs', Math.abs],
    ['sign', Math.sign],

    ['PI', free_td(Math.PI)],
    ['E', free_td(Math.E)]

])

const UnitFunctionMap = new Map([

    ['sin', (a) => unit(1)],
    ['cos', (a) => unit(1)],
    ['tan', (a) => unit(1)],
    ['acos', (a) => unit('radian')],
    ['asin', (a) => unit('radian')],
    ['atan', (a) => unit('radian')],
    
    ['cosh', (a) => unit(a)],
    ['sinh', (a) => unit(a)],
    ['tanh', (a) => unit(a)],
    ['acosh', (a) => unit(a)],
    ['asinh', (a) => unit(a)],
    ['atanh', (a) => unit(a)],
    
    ['degrees', (r) => unit('degree')],
    ['radians', (d) => unit('radian')],
    
    ['round', (a) => unit(a)],
    ['ceil', (a) => unit(a)],
    ['floor', (a) => unit(a)],
    ['fround', (a) => unit(a)],
    ['trunc', (a) => unit(a)],
    
    ['sqrt', unit.sqrt],
    ['pow', unit.pow],
    ['imul', unit.mul],

    ['mag', (a) => unit(a)], // measures magnitude of vector
    
    ['ln', (a) => unit(1)],
    ['log10', (a) => unit(1)],
    ['log2', (a) => unit(1)],
    ['exp', (a) => unit(1)],
    
    ['max', (a) => unit(a)],
    ['min', (a) => unit(a)],
    ['random', (a) => unit(1)],
    ['abs', (a) => unit(a)],
    ['sign', (a) => unit(1)],

    ['PI', (a) => unit(1)],
    ['E', (a) => unit(1)]

])

function free_td(val) {
    let t = $('<td>')
    t.data('value', val)
    return t
}

export { FunctionMap, UnitFunctionMap }


