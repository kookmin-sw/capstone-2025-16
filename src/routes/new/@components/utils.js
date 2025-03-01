export function convertOperator2Factor(raw_operator) {
    console.log(raw_operator);
    if (raw_operator === undefined) {
        return {
            operator: 'eq',
            value: null
        };
    }
    const keys = Object.keys(raw_operator);
    if (keys.length === 1)
        return {
            operator: keys[0],
            start: raw_operator[keys[0]]
        };
    else if (keys.length === 2) {
        if (keys.includes('gte') && keys.includes('lte')) {
            return {
                operator: 'bt',
                start: raw_operator.gte,
                end: raw_operator.lte
            };
        } else if (keys.includes('gt') && keys.includes('lt')) {
            return {
                operator: '!bt',
                start: raw_operator.gt,
                end: raw_operator.lt
            };
        }
    }
    throw new Error("unknown operator");
}
