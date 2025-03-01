export function convertOperator(raw_operator) {
    if (raw_operator.keys().length === 1)
        return raw_operator[raw_operator.keys()[0]];
    else if (raw_operator.keys().length === 2) {
        if (raw_operator.keys().includes('gte') && raw_operator.keys().includes('lte')) {
            return 'bt';
        } else if (raw_operator.keys().includes('gt') && raw_operator.keys().includes('lt')) {
            return '!bt';
        }
    }
    throw new Error("unknown operator");
}
