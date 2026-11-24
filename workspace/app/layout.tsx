import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Pathway · SAP & coding career workspace',description:'A living roadmap from ERP experience to software and automation.'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
