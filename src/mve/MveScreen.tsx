/**
 * MveScreen — the page to the left of the NeverSoft home desktop.
 *
 * It is now a single glass "wall" (see {@link AssistantWall}): the user's news
 * feed with embedded links, the NeverSoft Service Assistant's message log at the
 * bottom, and the APK download link. The sandbox shell that used to be a tab
 * here now lives as its own home-screen icon (cmd).
 */
import React from 'react';
import AssistantWall from '../desktop/AssistantWall';

const MveScreen: React.FC = () => <AssistantWall />;

export default MveScreen;
