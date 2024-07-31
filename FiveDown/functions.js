
/*  Provides a default Map of available functions

 
*/
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
    
    ['round', Math.round],
    ['ceil', Math.ceil],
    ['floor', Math.floor],
    ['fround', Math.fround],
    ['trunc', Math.trunc],
    
    ['sqrt', Math.sqrt],
    ['pow', Math.pow],
    ['hypot', Math.hypot],
    ['imul', Math.imul],
    
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

function free_td(val) {
    let t = $('<td>')
    t.data('value', val)
    return t
}

export { FunctionMap }


