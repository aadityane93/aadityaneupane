import './navbar.css'
function Navbar({navbar_content}) {

    return (
        <nav class='navbar'>
            <ul class='nav-list'>
            {navbar_content.map(function (value, index){
                return(
                    <li key={index}><a href={value}> {value} </a></li>
                )
            })}


            </ul>
        </nav>
    )
}

export default Navbar