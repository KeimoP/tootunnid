import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Translation keys and values
const translations = {
  et: {
    // Navigation
    'nav.dashboard': 'Töölaud',
    'nav.profile': 'Profiil',
    'nav.timeEntries': 'Ajakirjed',
    'nav.workRequests': 'Ühendused',
    'nav.myWorkers': 'Meeskond',
    'nav.logout': 'Logi välja',

    // Dashboard
    'dashboard.title': 'Tere tulemast TimeTracker\'isse',
    'dashboard.subtitle': 'Jälgi oma töötunde, halda aega ja arvuta sissetulekuid.',
    'dashboard.timeClock': 'Ajaarvestus',
    'dashboard.clockedIn': 'Tööl',
    'dashboard.clockedOut': 'Töölt väljas',
    'dashboard.startedAt': 'Alustatud kell',
    'dashboard.clockIn': 'Tööle',
    'dashboard.clockOut': 'Töölt ära',
    'dashboard.totalTime': 'Koguaeg',
    'dashboard.totalEarnings': 'Kogutulu',
    'dashboard.completedSessions': 'Lõpetatud sessioone',
    'dashboard.totalSessions': 'Kokku sessioone',
    'dashboard.quickActions': 'Kiirtoimingud',
    'dashboard.updateProfile': 'Uuenda profiili',
    'dashboard.updateProfileDesc': 'Seadista tunnitasu ja eelistused',
    'dashboard.shareHours': 'Jaga tunde',
    'dashboard.shareHoursDesc': 'Jaga oma ajaarvestust',
    'dashboard.connections': 'Ühendused',
    'dashboard.connectionsDesc': 'Halda ühendusi',
    'dashboard.viewHistory': 'Vaata ajalugu',
    'dashboard.viewHistoryDesc': 'Vaata kõiki ajakirjeid',

    // Work Requests
    'workRequests.title': 'Ühendused ja jagamine',
    'workRequests.subtitle': 'Ühenda teistega, et jagada oma ajaarvestust või vaadata teiste töötunde.',
    'workRequests.received': 'Saadud',
    'workRequests.sent': 'Saadetud',
    'workRequests.shareCode': 'Jagamiskood',
    'workRequests.yourSharingCode': 'Sinu jagamiskood',
    'workRequests.shareCodeDesc': 'Jaga seda koodi teistega, et nad saaksid vaadata sinu töötunde.',
    'workRequests.codeRotationNotice': 'Sinu jagamiskood muutub automaatselt iga 5 minuti tagant turvalisuse huvides.',
    'workRequests.connectToSomeone': 'Ühenda kellegagi',
    'workRequests.enterCodeDesc': 'Sisesta kellegi jagamiskood, et vaadata tema töötunde.',
    'workRequests.enterCodePlaceholder': 'Sisesta 6-kohaline kood',
    'workRequests.codeCopied': 'Kood kopeeritud lõikelauale!',
    'workRequests.failedToCopy': 'Koodi kopeerimine ebaõnnestus',
    'workRequests.validCodeRequired': 'Palun sisesta kehtiv 6-kohaline kood',
    'workRequests.connectionSuccess': 'Ühendus loodud kasutajaga {name}! Saad nüüd vaadata tema töötunde.',
    'workRequests.connectionFailed': 'Koodi kasutamine ebaõnnestus',
    'workRequests.codeExpired': 'Kood võib olla aegunud. Koodid muutuvad iga 5 minuti tagant.',
    'workRequests.failedToLoadCode': 'Jagamiskoodi laadimine ebaõnnestus',
    'workRequests.receivedRequests': 'Saadud päringud',
    'workRequests.sentRequests': 'Saadetud päringud',
    'workRequests.noReceivedRequests': 'Tööpäringuid pole veel saadud.',
    'workRequests.noSentRequests': 'Tööpäringuid pole veel saadetud.',
    'workRequests.role': 'Roll',
    'workRequests.sentOn': 'Saadetud',

    // Common
    'common.loading': 'Laeb...',
    'common.copy': 'Kopeeri',
    'common.connect': 'Ühenda',
    'common.accept': 'Nõustu',
    'common.reject': 'Lükka tagasi',
    'common.pending': 'Ootel',
    'common.accepted': 'Vastu võetud',
    'common.rejected': 'Tagasi lükatud',

    // Profile
    'profile.title': 'Profiil',
    'profile.subtitle': 'Halda oma profiiliteavet ja eelistusi',
    'profile.personalInfo': 'Isikuandmed',
    'profile.name': 'Nimi',
    'profile.email': 'E-post',
    'profile.workSettings': 'Töösätted',
    'profile.hourlyWage': 'Tunnitasu (€)',
    'profile.hourlyWageDesc': 'Sisesta oma tunnitasu tulu arvutamiseks',
    'profile.updating': 'Uuendab...',
    'profile.update': 'Uuenda profiili',
    'profile.editProfile': 'Muuda profiili',
    'profile.fullName': 'Täisnimi',
    'profile.memberSince': 'Liige alates',
    'profile.role': 'Roll',
    'profile.profileUpdatedSuccess': 'Profiil on edukalt uuendatud!',
    'profile.failedToUpdate': 'Profiili uuendamine ebaõnnestus',
    'profile.profilePicture': 'Profiilipilt',
    'profile.uploadPicture': 'Laadi pilt üles',
    'profile.changePicture': 'Muuda pilti',
    'profile.invalidFileType': 'Palun valige pildifail (JPG, PNG, jne)',
    'profile.fileTooLarge': 'Fail on liiga suur. Maksimaalne suurus on 5MB',
    'profile.profilePictureUpdated': 'Profiilipilt on edukalt uuendatud!',
    'profile.failedToUpdatePicture': 'Profiilipildi uuendamine ebaõnnestus',

    // Team profile page
    'team.profile': 'Meeskonna profiil',
    'team.userNotFound': 'Kasutajat ei leitud',
    'team.profileNotVisible': 'Profiil ei ole nähtav',
    'team.failedToLoad': 'Profiili laadimine ebaõnnestus',
    'team.cannotViewProfile': 'Profiili ei saa vaadata',
    'team.profileNotFound': 'Profiili ei leitud',
    'team.manager': 'Juht',
    'team.member': 'Liige',
    'team.someInfoHidden': 'Mõned andmed on privaatsuse seadete tõttu peidetud',
    'team.teamMembers': 'Meeskonna liikmed',
    'team.managers': 'Juhid',

    // Common
    'common.back': 'Tagasi',

    // Clock page
    'clock.title': 'Ajaarvestus',
    'clock.subtitle': 'Alusta ja lõpeta oma töösessioone',
    'clock.currentTime': 'Praegune aeg',
    'clock.status': 'Olek',
    'clock.activeSession': 'Aktiivne sessioon',
    'clock.clockIn': 'Tööle',
    'clock.clockOut': 'Töölt ära',
    'clock.sessionTime': 'Sessiooni aeg',
    'clock.todayTotal': 'Täna kokku',
    'clock.todayEarnings': 'Täna teenitud',
    'clock.wageSetup': 'Tunnitasu seadistamine',
    'clock.wageSetupDesc': 'Seadista oma tunnitasu profiilis, et näha sissetulekuid',
    'clock.earningsInfo': 'Sinu sissetulekud arvutatakse tunnitasu põhjal',
    'clock.recentHistory': 'Viimane ajalugu',
    'clock.noTimeEntries': 'Ajakirjeid pole veel',
    'clock.noTimeEntriesDesc': 'Sinu tööle-minekud ja töölt-ära-minekud kuvatakse siin',
    'clock.currentlyWorking': 'Praegu tööl',
    'clock.in': 'Sisse',
    'clock.out': 'Välja',
    'clock.editTime': 'Muuda aega',
    'clock.editClockOut': 'Muuda väljamineku aega',
    'clock.editClockOutDesc': 'Korrigeeri väljamineku aega, kui unustasid välja logida või on vaja aega parandada.',
    'clock.clockOutTime': 'Väljamineku aeg',
    'clock.save': 'Salvesta',
    'clock.cancel': 'Tühista',
    'clock.updateSuccess': 'Väljamineku aeg edukalt uuendatud',
    'clock.updateError': 'Väljamineku aja uuendamine ebaõnnestus',
    'clock.remove': 'Eemalda',
    'clock.removeEntry': 'Eemalda ajakirje',
    'clock.removeConfirm': 'Kas oled kindel, et tahad selle ajakirje eemaldada?',
    'clock.removeWarning': 'Seda tegevust ei saa tagasi võtta.',
    'clock.removeSuccess': 'Ajakirje edukalt eemaldatud',
    'clock.removeError': 'Ajakirje eemaldamine ebaõnnestus',
    'clock.notWorking': 'Ei tööta',
    'clock.clockingIn': 'Sisselogimine...',
    'clock.clockingOut': 'Väljalogmisine...',
    'clock.currentSession': 'Praegune sessioon',
    'clock.startedAt': 'Alustatud',
    'clock.saving': 'Salvestamine...',
    'clock.removing': 'Eemaldamine...',
    'clock.timeFormat': '24',
    'clock.dateLocale': 'et-EE',

    // Time Entries
    'timeEntries.title': 'Ajakirjed',
    'timeEntries.subtitle': 'Vaata ja halda oma tööaja kirjeid.',
    'timeEntries.filterByDate': 'Filtreeri kuupäeva järgi',
    'timeEntries.noEntriesFound': 'Valitud filtritele vastavaid ajakirjeid ei leitud.',
    'timeEntries.exportCsv': 'Ekspordi CSV',
    'timeEntries.dateRange': 'Kuupäevavahemik',
    'timeEntries.status': 'Olek',
    'timeEntries.allTime': 'Kogu aeg',
    'timeEntries.today': 'Täna',
    'timeEntries.thisWeek': 'See nädal',
    'timeEntries.thisMonth': 'See kuu',
    'timeEntries.all': 'Kõik',
    'timeEntries.active': 'Aktiivne',
    'timeEntries.completed': 'Lõpetatud',
    'timeEntries.showingEntriesFor': 'Näitan kirjeid:',
    'timeEntries.recentEntries': 'Hiljutised kirjed',
    'timeEntries.date': 'Kuupäev',
    'timeEntries.clockIn': 'Sisse',
    'timeEntries.clockOut': 'Välja',
    'timeEntries.duration': 'Kestus',
    'timeEntries.earnings': 'Teenitud',
    'timeEntries.totalTime': 'Kogu aeg',
    'timeEntries.totalEarnings': 'Kogutulu',
    'timeEntries.totalSessions': 'Kokku sessioone',
    'timeEntries.exportFailed': 'Andmete eksportimine ebaõnnestus. Palun proovi uuesti.',
    'timeEntries.actions': 'Tegevused',

    // Navigation fixes
    'nav.clock': 'Kell',

    // Authentication
    'auth.welcomeBack': 'Tere tulemast tagasi',
    'auth.signInAccount': 'Logi sisse oma TimeTracker kontole',
    'auth.emailAddress': 'E-posti aadress',
    'auth.password': 'Parool',
    'auth.enterEmail': 'Sisesta oma e-post',
    'auth.enterPassword': 'Sisesta oma parool',
    'auth.signingIn': 'Sisselogimine...',
    'auth.signIn': 'Logi sisse',
    'auth.noAccount': 'Pole kontot?',
    'auth.signUpHere': 'Registreeru siin',
    'auth.trackTimeFeatures': 'Jälgi oma aega • Halda oma meeskonda • Arvuta sissetulekuid',
    'auth.createAccount': 'Loo konto',
    'auth.joinTimeTracker': 'Liitu TimeTrackeriga ja hakka jagama oma töötunde',
    'auth.fullName': 'Täisnimi',
    'auth.enterFullName': 'Sisesta oma täisnimi',
    'auth.createPassword': 'Loo parool',
    'auth.creatingAccount': 'Konto loomine...',
    'auth.haveAccount': 'On juba konto?',
    'auth.signInHere': 'Logi sisse siin',
    'auth.termsAgreement': 'Konto loomisega nõustud meie Teenuste Tingimustega',
    'auth.loginFailed': 'Sisselogimine ebaõnnestus',
    'auth.networkError': 'Võrguühenduse viga. Palun proovi uuesti.',
    'auth.registrationFailed': 'Registreerimine ebaõnnestus',

    // Privacy and Security
    'privacy.dataProtected': 'Sinu andmed on kaitstud',
    'privacy.encryptedStorage': 'Palgaandmed on krüpteeritud',
    'privacy.noDevAccess': 'Arendajad ei pääse ligi tundlikele andmetele',
    'privacy.autoRotation': 'Jagamiskoodid muutuvad automaatselt',

    // Profile relationships
    'profile.myManagers': 'Mind jälgib',
    'profile.myTeam': 'Minu meeskond',
    'profile.noWorkRelationships': 'Pole töösuhteid',
    'profile.noWorkRelationshipsDesc': 'Sa pole veel ühendusse võtnud juhtide ega töötajatega.',
    'profile.sendWorkRequest': 'Saada tööpäring',

    // My Workers page
    'myWorkers.title': 'Meeskond',
    'myWorkers.subtitle': 'Vaata oma meeskonna liikmete töötunde',
    'myWorkers.tabITrack': 'Mina jälgin',
    'myWorkers.tabTracksMe': 'Mind jälgib',
    'myWorkers.sharingWithMe': 'Jagab minuga',
    'myWorkers.iShareWith': 'Mina jagan',
    'myWorkers.noActivity': 'Pole aktiivsust',
    'myWorkers.activeToday': 'Aktiivne täna',
    'myWorkers.activeThisWeek': 'Aktiivne sel nädalal',
    'myWorkers.inactive': 'Mitteaktiivne',
    'myWorkers.hoursWorked': 'Töötunde',
    'myWorkers.earnings': 'Teenitud',
    'myWorkers.sessions': 'Sessioone',
    'myWorkers.hourlyRate': 'Tunnitasu',
    'myWorkers.memberSince': 'Liige alates',
    'myWorkers.noTeamMembers': 'Pole meeskonna liikmeid',
    'myWorkers.noTeamMembersDesc': 'Sa pole veel ühendusse võtnud töötajatega.',
    'myWorkers.viewDetails': 'Vaata detaile',
    'myWorkers.viewProfile': 'Vaata profiili',
    'myWorkers.viewTimeEntries': 'Vaata ajakirjeid',
    'myWorkers.totalHours': 'Kokku tunde',
    'myWorkers.totalEarnings': 'Kogutulu',
    'myWorkers.lastActive': 'Viimati aktiivne',

    // Clock page
    'clock.howItWorks': 'Kuidas see toimib',
    'clock.clockInDesc': 'Vajuta "Tööle" nuppu, et alustada oma tööpäeva',
    'clock.clockOutDesc': 'Vajuta "Töölt ära" nuppu, et lõpetada oma tööpäev',
    'clock.automaticTracking': 'Automaatne jälgimine',
    'clock.automaticTrackingDesc': 'Rakendus jälgib automaatselt su tööaega',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Profile',
    'nav.timeEntries': 'Time Entries',
    'nav.workRequests': 'Connections',
    'nav.myWorkers': 'Team',
    'nav.logout': 'Logout',

    // Dashboard
    'dashboard.title': 'Welcome to TimeTracker',
    'dashboard.subtitle': 'Track your work hours, manage your time, and calculate your earnings.',
    'dashboard.timeClock': 'Time Clock',
    'dashboard.clockedIn': 'Clocked In',
    'dashboard.clockedOut': 'Clocked Out',
    'dashboard.startedAt': 'Started at',
    'dashboard.clockIn': 'Clock In',
    'dashboard.clockOut': 'Clock Out',
    'dashboard.totalTime': 'Total Time',
    'dashboard.totalEarnings': 'Total Earnings',
    'dashboard.completedSessions': 'Completed Sessions',
    'dashboard.totalSessions': 'Total Sessions',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.updateProfile': 'Update Profile',
    'dashboard.updateProfileDesc': 'Set hourly wage & preferences',
    'dashboard.shareHours': 'Share Hours',
    'dashboard.shareHoursDesc': 'Share your time tracking',
    'dashboard.connections': 'Connections',
    'dashboard.connectionsDesc': 'Manage connections',
    'dashboard.viewHistory': 'View History',
    'dashboard.viewHistoryDesc': 'See all time entries',

    // Work Requests
    'workRequests.title': 'Connections & Sharing',
    'workRequests.subtitle': 'Connect with others to share your time tracking or view others\' work hours.',
    'workRequests.received': 'Received',
    'workRequests.sent': 'Sent',
    'workRequests.shareCode': 'Share Code',
    'workRequests.yourSharingCode': 'Your Sharing Code',
    'workRequests.shareCodeDesc': 'Share this code with others so they can view your work hours.',
    'workRequests.codeRotationNotice': 'Your sharing code changes automatically every 5 minutes for security.',
    'workRequests.connectToSomeone': 'Connect to Someone',
    'workRequests.enterCodeDesc': 'Enter someone\'s sharing code to view their work hours.',
    'workRequests.enterCodePlaceholder': 'Enter 6-character code',
    'workRequests.codeCopied': 'Code copied to clipboard!',
    'workRequests.failedToCopy': 'Failed to copy code',
    'workRequests.validCodeRequired': 'Please enter a valid 6-character code',
    'workRequests.connectionSuccess': 'Successfully connected to {name}! You can now view their work hours.',
    'workRequests.connectionFailed': 'Failed to use code',
    'workRequests.codeExpired': 'Code may have expired. Codes change every 5 minutes.',
    'workRequests.failedToLoadCode': 'Failed to load sharing code',
    'workRequests.receivedRequests': 'Requests You\'ve Received',
    'workRequests.sentRequests': 'Requests You\'ve Sent',
    'workRequests.noReceivedRequests': 'No work requests received yet.',
    'workRequests.noSentRequests': 'No work requests sent yet.',
    'workRequests.role': 'Role',
    'workRequests.sentOn': 'Sent on',

    // Common
    'common.loading': 'Loading...',
    'common.copy': 'Copy',
    'common.connect': 'Connect',
    'common.accept': 'Accept',
    'common.reject': 'Reject',
    'common.pending': 'Pending',
    'common.accepted': 'Accepted',
    'common.rejected': 'Rejected',

    // Profile
    'profile.title': 'Profile',
    'profile.subtitle': 'Manage your profile information and preferences',
    'profile.personalInfo': 'Personal Information',
    'profile.name': 'Name',
    'profile.email': 'Email',
    'profile.workSettings': 'Work Settings',
    'profile.hourlyWage': 'Hourly Wage (€)',
    'profile.hourlyWageDesc': 'Enter your hourly wage to calculate earnings',
    'profile.updating': 'Updating...',
    'profile.update': 'Update Profile',
    'profile.editProfile': 'Edit Profile',
    'profile.fullName': 'Full Name',
    'profile.memberSince': 'Member Since',
    'profile.role': 'Role',
    'profile.profileUpdatedSuccess': 'Profile updated successfully!',
    'profile.failedToUpdate': 'Failed to update profile',
    'profile.profilePicture': 'Profile Picture',
    'profile.uploadPicture': 'Upload Picture',
    'profile.changePicture': 'Change Picture',
    'profile.invalidFileType': 'Please select an image file (JPG, PNG, etc)',
    'profile.fileTooLarge': 'File is too large. Maximum size is 5MB',
    'profile.profilePictureUpdated': 'Profile picture updated successfully!',
    'profile.failedToUpdatePicture': 'Failed to update profile picture',

    // Team profile page
    'team.profile': 'Team Profile',
    'team.userNotFound': 'User not found',
    'team.profileNotVisible': 'Profile is not visible',
    'team.failedToLoad': 'Failed to load profile',
    'team.cannotViewProfile': 'Cannot view profile',
    'team.profileNotFound': 'Profile not found',
    'team.manager': 'Manager',
    'team.member': 'Member',
    'team.someInfoHidden': 'Some information is hidden due to privacy settings',
    'team.teamMembers': 'Team Members',
    'team.managers': 'Managers',

    // Common
    'common.back': 'Back',

    // Clock page
    'clock.title': 'Time Clock',
    'clock.subtitle': 'Start and end your work sessions',
    'clock.currentTime': 'Current Time',
    'clock.status': 'Status',
    'clock.activeSession': 'Active Session',
    'clock.clockIn': 'Clock In',
    'clock.clockOut': 'Clock Out',
    'clock.sessionTime': 'Session Time',
    'clock.todayTotal': 'Today Total',
    'clock.todayEarnings': 'Today Earnings',
    'clock.wageSetup': 'Wage Setup',
    'clock.wageSetupDesc': 'Set up your hourly wage in your profile to see earnings',
    'clock.earningsInfo': 'Your earnings will be calculated based on your hourly wage',
    'clock.recentHistory': 'Recent History',
    'clock.noTimeEntries': 'No time entries yet',
    'clock.noTimeEntriesDesc': 'Your clock-ins and clock-outs will appear here',
    'clock.currentlyWorking': 'Currently working',
    'clock.in': 'In',
    'clock.out': 'Out',
    'clock.editTime': 'Edit Time',
    'clock.editClockOut': 'Edit Clock Out Time',
    'clock.editClockOutDesc': 'Adjust the clock out time if you forgot to clock out or need to correct the time.',
    'clock.clockOutTime': 'Clock Out Time',
    'clock.save': 'Save',
    'clock.cancel': 'Cancel',
    'clock.updateSuccess': 'Clock out time updated successfully',
    'clock.updateError': 'Failed to update clock out time',
    'clock.remove': 'Remove',
    'clock.removeEntry': 'Remove Time Entry',
    'clock.removeConfirm': 'Are you sure you want to remove this time entry?',
    'clock.removeWarning': 'This action cannot be undone.',
    'clock.removeSuccess': 'Time entry removed successfully',
    'clock.removeError': 'Failed to remove time entry',
    'clock.notWorking': 'Not Working',
    'clock.clockingIn': 'Clocking In...',
    'clock.clockingOut': 'Clocking Out...',
    'clock.currentSession': 'Current Session',
    'clock.startedAt': 'Started at',
    'clock.saving': 'Saving...',
    'clock.removing': 'Removing...',
    'clock.timeFormat': '12',
    'clock.dateLocale': 'en-US',

    // Time Entries
    'timeEntries.title': 'Time Entries',
    'timeEntries.subtitle': 'View and manage your work time records.',
    'timeEntries.filterByDate': 'Filter by date',
    'timeEntries.noEntriesFound': 'No time entries found for the selected filters.',
    'timeEntries.exportCsv': 'Export CSV',
    'timeEntries.dateRange': 'Date Range',
    'timeEntries.status': 'Status',
    'timeEntries.allTime': 'All Time',
    'timeEntries.today': 'Today',
    'timeEntries.thisWeek': 'This Week',
    'timeEntries.thisMonth': 'This Month',
    'timeEntries.all': 'All',
    'timeEntries.active': 'Active',
    'timeEntries.completed': 'Completed',
    'timeEntries.showingEntriesFor': 'Showing entries for:',
    'timeEntries.recentEntries': 'Recent Entries',
    'timeEntries.date': 'Date',
    'timeEntries.clockIn': 'Clock In',
    'timeEntries.clockOut': 'Clock Out',
    'timeEntries.duration': 'Duration',
    'timeEntries.earnings': 'Earnings',
    'timeEntries.totalTime': 'Total Time',
    'timeEntries.totalEarnings': 'Total Earnings',
    'timeEntries.totalSessions': 'Total Sessions',
    'timeEntries.exportFailed': 'Failed to export data. Please try again.',
    'timeEntries.actions': 'Actions',

    // Navigation fixes
    'nav.clock': 'Clock',

    // Authentication
    'auth.welcomeBack': 'Welcome Back',
    'auth.signInAccount': 'Sign in to your TimeTracker account',
    'auth.emailAddress': 'Email Address',
    'auth.password': 'Password',
    'auth.enterEmail': 'Enter your email',
    'auth.enterPassword': 'Enter your password',
    'auth.signingIn': 'Signing In...',
    'auth.signIn': 'Sign In',
    'auth.noAccount': 'Don\'t have an account?',
    'auth.signUpHere': 'Sign up here',
    'auth.trackTimeFeatures': 'Track your work time • Manage your team • Calculate earnings',
    'auth.createAccount': 'Create Account',
    'auth.joinTimeTracker': 'Join TimeTracker and start sharing your work hours',
    'auth.fullName': 'Full Name',
    'auth.enterFullName': 'Enter your full name',
    'auth.createPassword': 'Create a password',
    'auth.creatingAccount': 'Creating Account...',
    'auth.haveAccount': 'Already have an account?',
    'auth.signInHere': 'Sign in here',
    'auth.termsAgreement': 'By creating an account, you agree to our Terms of Service',
    'auth.loginFailed': 'Login failed',
    'auth.networkError': 'Network error. Please try again.',
    'auth.registrationFailed': 'Registration failed',

    // Privacy and Security
    'privacy.dataProtected': 'Your data is protected',
    'privacy.encryptedStorage': 'Salary data is encrypted',
    'privacy.noDevAccess': 'Developers cannot access sensitive data',
    'privacy.autoRotation': 'Sharing codes rotate automatically',

    // Profile relationships
    'profile.myManagers': 'My Managers',
    'profile.myTeam': 'My Team',
    'profile.noWorkRelationships': 'No Work Relationships',
    'profile.noWorkRelationshipsDesc': 'You haven\'t connected with any managers or workers yet.',
    'profile.sendWorkRequest': 'Send Work Request',

    // My Workers page
    'myWorkers.title': 'Team',
    'myWorkers.subtitle': 'View and manage your team members\' work hours',
    'myWorkers.tabITrack': 'I Track',
    'myWorkers.tabTracksMe': 'Tracks Me',
    'myWorkers.sharingWithMe': 'Sharing With Me',
    'myWorkers.iShareWith': 'I Share With',
    'myWorkers.noActivity': 'No activity',
    'myWorkers.activeToday': 'Active today',
    'myWorkers.activeThisWeek': 'Active this week',
    'myWorkers.inactive': 'Inactive',
    'myWorkers.hoursWorked': 'Hours Worked',
    'myWorkers.earnings': 'Earnings',
    'myWorkers.sessions': 'Sessions',
    'myWorkers.hourlyRate': 'Hourly Rate',
    'myWorkers.memberSince': 'Member since',
    'myWorkers.noTeamMembers': 'No Team Members',
    'myWorkers.noTeamMembersDesc': 'You haven\'t connected with any workers yet.',
    'myWorkers.viewDetails': 'View Details',
    'myWorkers.viewProfile': 'View Profile',
    'myWorkers.viewTimeEntries': 'View Time Entries',
    'myWorkers.totalHours': 'Total Hours',
    'myWorkers.totalEarnings': 'Total Earnings',
    'myWorkers.lastActive': 'Last Active',

    // Clock page
    'clock.howItWorks': 'How It Works',
    'clock.clockInDesc': 'Click "Clock In" to start your work day',
    'clock.clockOutDesc': 'Click "Clock Out" to end your work day',
    'clock.automaticTracking': 'Automatic Tracking',
    'clock.automaticTrackingDesc': 'The app automatically tracks your work time',
  }
};

type Language = 'et' | 'en';
type TranslationKey = keyof typeof translations.et;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize language from localStorage or default to Estonian
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('timetracker-language');
      return (savedLanguage as Language) || 'et';
    }
    return 'et'; // Default to Estonian for SSR
  });

  // Save language to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('timetracker-language', language);
    }
  }, [language]);

  const t = (key: TranslationKey, params?: Record<string, string>): string => {
    let text = translations[language][key] || translations.en[key] || key;
    
    // Replace parameters in the text
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, value);
      });
    }
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
