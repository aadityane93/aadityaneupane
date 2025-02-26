function Header() {

    const navcontent = ['Home', 'About', 'Projects', 'Contact'];

    const navItems = navcontent.map(navItem =>
        <li key={navItem}>
            <a href={'#${navItem}'}>
                {navItem}
            </a>
        </li>
    );
    return (

        <ul>
            {navItems}
        </ul>
    );
}

export default Header;