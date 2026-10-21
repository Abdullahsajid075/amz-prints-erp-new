import React from 'react';
import ErpHomeLauncher from '@/components/layout/ErpHomeLauncher';

/**
 * `/dashboard` is the application launcher — icons only, organized by
 * category, with drag-and-drop rearranging (see ErpHomeLauncher). It
 * deliberately shows no KPIs/widgets/feature lists; consolidated business
 * numbers live on the dedicated Overview page (`/overview`), reachable from
 * its own tile in the grid below.
 */
const Dashboard = () => <ErpHomeLauncher />;

export default Dashboard;
