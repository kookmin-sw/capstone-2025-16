function datefotmat(date){
    let newdate = new Date(date);
    let dateFormat =  newdate.getFullYear() + '년 ' + newdate.getMonth() + '월 ' + newdate.getDay() + '일';
    return dateFormat;
}

export const data = [
    {
        id: 1,
        date: datefotmat("2024-02-28"),
        gender: '남',
        age: '22',
    },
    {
        id: 2,
        date: datefotmat("2024-02-06"),
        gender: '여',
        age: '23',
    },
    {
        id: 3,
        date: datefotmat("2024-02-07"),
        gender: '남',
        age: '24',
    },
    {
        id: 4,
        date: datefotmat("2024-02-08"),
        gender: '여',
        age: '26',
    },
    {
        id: 5,
        date: datefotmat("2024-02-09"),
        gender: '남',
        age: '28',
    },
];