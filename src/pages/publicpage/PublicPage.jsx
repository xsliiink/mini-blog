import {useParams} from 'react-router-dom';

export default function PublicPage(){
    const {id} = useParams();
    return (
        <h1>User page  {id}</h1>
    )
}