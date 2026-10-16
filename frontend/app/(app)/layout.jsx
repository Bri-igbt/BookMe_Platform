'use client'

import logo from '@/app/assets/logo.png';
import hexagonLogo from '@/app/assets/Hexagon Logo.png';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, LogOut, SquareMenu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getMe } from '@/app/api/auth.js';
import { appLayoutStyles as s } from '@/app/assets/dummyStyles.jsx';
import Link from 'next/link';
import Image from 'next/image';

const navItems = [
	{ href: "/", label: "Dashboard" },
	{ href: "/profile", label: "Profile" },
	{ href: "/services", label: "Services" },
	{ href: "/availability", label: "Availability" },
	{ href: "/bookings", label: "Bookings" },
	{ href: "/payments", label: "Payments" },
]

const isActivePath = (pathname, href) =>
	href === "/"
		? pathname === "/"
		: pathname === href || pathname.startsWith(`${href}/`);

const layout = ({ children }) => {
	const router = useRouter();
	const pathname = usePathname() || "/";
	const [authState, setAuthState] = useState("checking"); 
	const [user, setUser] = useState(null);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef(null);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setDropdownOpen(false);
			};
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);

	}, []);

	useEffect(() => {
		if (!localStorage.getItem('token')) {
			setAuthState("signedOut");
			router.replace('/login');
			return undefined;
		}

		setAuthState("signedIn");
		let isActive = true;

		getMe()
			.then(({ data }) => {
				if (isActive) setUser(data?.user);
			})
			.catch((error) => {
				if (error.response?.status === 401) {
					localStorage.removeItem('token');
					router.replace('/login');
				}
			});

		return () => {
			isActive = false;
		};
	}, [router]);

	const handleLogout = () => {
		localStorage.removeItem('token')
		router.replace('/login')
	};

	if (authState !== "signedIn") return null;

	const displayName = user?.businessName || user?.name || "My Business";
	const avatarInitial = displayName.slice(0, 1).toUpperCase();

	return (
		<div className={s.container}>
			<header className={s.header}>
				<div className={s.headerInner}>
					<Link href='/' className={s.loginLink}>
						<Image
							src={logo}
							alt='BookMe logo'
							className={s.logoImg}
							width={20}
							height={20}
						/>
						<span className={s.logoText}>BookMe</span>
					</Link>

					<nav className={s.navDesktop}>
						{navItems.map((item) => {
							const active = isActivePath(pathname, item.href);

							return (
								<Link
									key={item.href}
									href={item.href}
									aria-current={active ? 'page' : undefined}
									className={active ? s.navLinkActive : s.navLinkInactive}
								>
									{item.label}
								</Link>
							);
						})}
					</nav>

					<div className={s.rightSection}>
						<div className={s.accountMenu} ref={dropdownRef}>
							<button
								type='button'
								className={s.avatarButton}
								aria-haspopup='menu'
								aria-expanded={dropdownOpen}
								onClick={() => setDropdownOpen(!dropdownOpen)}
							>
								<div className={s.avatarCircle}>
									{avatarInitial}
								</div>

								<span className={s.displayName}>
									{displayName}
								</span>

								<ChevronDown
									className={dropdownOpen
										? `${s.chevron} ${s.chevronOpen}`
										: s.chevron
									}
								/>
							</button>

							{dropdownOpen && (
								<div className={s.dropdown}>
									<button
										type='button'
										onClick={() => {
											setDropdownOpen(false);
											handleLogout();
										}}
										className={s.logoutButton}
									>
										<LogOut className={s.logoutIcon} />
										Log out
									</button>
								</div>
							)}
						</div>

						{/* Mobile menu button */}
						<button
							type="button"
							className={s.mobileMenuButton}
							aria-expanded={mobileMenuOpen}
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						>
							<span className={s.srOnly}>Open main menu</span>
							{mobileMenuOpen ? (
								<X className={s.mobileMenuIcon} aria-hidden="true" />
							) : (
								<SquareMenu className={s.mobileMenuIcon} aria-hidden="true" />
							)}
						</button>
					</div>
				</div>

				{/* Mobile navigation menu */}
				{mobileMenuOpen && (
					<div className={s.mobileNav}>
						<div className={s.mobileNavInner}>
							{navItems.map((item) => {
								const active = isActivePath(pathname, item.href);

								return (
									<Link
										key={item.href}
										href={item.href}
										onClick={() => setMobileMenuOpen(false)}
										aria-current={active ? 'page' : undefined}
										className={active ? s.mobileNavLinkActive : s.mobileNavLinkInactive}
									>
										{item.label}
									</Link>
								);
							})}
						</div>
					</div>
				)}
			</header>

			<main className={s.main}>{children}</main>

			<footer className={s.footerBrandSection}>
				<div className={s.footerCard}>
					<div className={s.footerCardTop}>
						<div className={s.footerBrandMark}>
							<Image
								src={logo}
								className={s.footerMiniLogo}
								alt='BookMe logo'
								width={20}
								height={20}
							/>

							<span className={s.footerBrandName}>BookMe</span>
						</div>
					</div>

					<div className={s.footerRule} />

					<div>
						<div>
							<span>
								© {new Date().getFullYear()} BookMe. All rights reserved.
							</span>

							<div className={s.footerLinks}>
								<Link href='/privacy' className={s.footerLink}> Privacy Policy </Link>
								<span className={s.footerSeparator}>•</span>

								<Link href='/terms' className={s.footerLink}> Terms of Service </Link>
							</div>
						</div>

						<div className={s.footerCreditWrapper}>
							<a
								href="https://cbright.vercel.app/"
								target='_blank'
								rel='noreferrer'
								className={s.footerCreditLink}
							>
								<Image
									src={hexagonLogo}
									className={s.footerCreditLogo}
									width={20}
									height={20}
									alt='Hexagon logo'
								/>

								<span className={s.footerCreditText}>
									A <span className={s.footerCreditName}>Stack Quest Services</span> product
								</span>
							</a>
						</div>
					</div>

				</div>

				<div className={s.footerWatermarkWrapper}>
					<div className={s.footerLogoWatermark}>BookMe</div>
				</div>
			</footer>
		</div>
	)
}

export default layout