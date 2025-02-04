import {data} from '../data';

export async function load({params}){
    const user = data.find((user) => user.id == params.user);
    return {user};
}