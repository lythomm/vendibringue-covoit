---
title: "Product Brief: VendiBringue Covoit'"
status: "complete"
created: "2026-04-17T14:58:00+02:00"
updated: "2026-04-17T15:00:00+02:00"
inputs: ["brainstorming-session-2026-04-17-1337.md"]
---

# Product Brief: VendiBringue Covoit'

## Executive Summary

Organizing carpooling for informal, private events (like parties with friends) is currently trapped between overly complex platforms designed for strangers (BlaBlaCar) and chaotic organizational methods (sprawling group chats or messy spreadsheets). **VendiBringue Covoit'** is a free, frictionless web application designed to solve this exact problem. By eliminating accounts, passwords, and manual data entry, the app offers an ultra-lightweight, map-centric experience. Users simply share an event URL in a Messenger group, drivers tap the map to offer a ride, and passengers claim a seat instantly—redirecting both parties to real-life messaging apps (WhatsApp, SMS, Instagram) to finalize details. 

## The Problem

When a group of friends organizes a party in a more remote or specific location, ensuring everyone has a safe ride there and back becomes a logistical nightmare. 
*   **The "Group Chat" Chaos:** Asking "who has a car?" results in lost messages, miscommunications, and unoptimized cars.
*   **The Platform Friction:** Using commercial carpooling apps requires creating accounts, logging in, and dealing with payment features that are completely irrelevant and awkward among friends.
*   **The "Spreadsheet" Fatigue:** No one wants to open a Google Sheet on their mobile phone while at a pre-party or running late. 

The pain is the friction of coordination. The cost is time, frustration, and sometimes friends not showing up or taking unsafe transport options.

## The Solution

VendiBringue Covoit' provides a bimodal, map-first approach focused entirely on simplicity.
*   **Zero-Friction Access:** A shared URL drops users directly onto a map interface. No complex forms.
*   **Unified "Throwaway" Identity:** Users authenticate using only their phone number (the most reliable primary key in private circles) and a quick 4-digit PIN stored in `LocalStorage`.
*   **Gestural Creation:** Drivers long-press or tap the map to drop their starting point, bypassing tedious text inputs for city names or exact addresses.
*   **Decentralized Socialization:** Instead of building a clunky in-app chat, VendiBringue deep-links directly! When a passenger selects a ride, they are instantly redirected to the driver's WhatsApp, Messenger, or SMS app to say "Hey, I'm booking the back seat!"

## What Makes This Different

Our moat isn't a complex proprietary algorithm; it's **hyper-simplicity and social pragmatism**. While competitors (like Togetzer or Caroster) minimize friction, VendiBringue Covoit' removes it entirely from the communication phase by leveraging deep-links. We acknowledge that friends already have communication channels open. We provide the visual organization layer (the map) and let their native OS apps handle the rest. The rigorous use of a Phone + PIN logic prevents spam and duplicate identities without the heaviness of OAuth or email verification. 

## Who This Serves

*   **The Organizer (Host):** Wants peace of mind knowing how everyone is arriving without having to play dispatcher.
*   **The Driver (The "Sam"):** Wants to easily signal they have 3 spare spots from a specific neighborhood without answering 15 individual texts.
*   **The Passenger:** Wants to open a link, see who is nearby, tap a button, and immediately coordinate via WhatsApp. 

## Success Criteria

Because this is a free, 100% side-project aimed initially at friends, success is measured by adoption within a given event:
*   **High conversion rate:** 80%+ of users who open the link successfully post a seat or book one.
*   **Zero-support usage:** Users understand how the map and the PIN system work natively without reading instructions.
*   **Viral loops:** Participants of the first event ask the developer to generate a new URL for *their* next party.

## Scope

*   **In for V1:** Map-based UI (Leaflet), Bi-modal flow (Driver/Passenger split), Phone+PIN Auth (Supabase), LocalStorage persistent sessions, Deep-link generation (WhatsApp/Insta/SMS), 1-booking-per-device strict limitation, ability for drivers to remove passengers, ability for passengers to un-book.
*   **Privacy Stance for V1:** Phone numbers will be visible to users on the map to facilitate easy coordination among friends; the event URL acts as the primary access barrier.
*   **Explicitly Out:** In-app messaging, Payments, complex profile pictures, multi-event user dashboards (the experience is contained per event URL).

## Vision

VendiBringue Covoit' starts as the definitive free utility for a specific circle of friends. If successful, it becomes an open-source, easily deployable template that any friend group can spin up in 5 minutes for their weddings, raves, or weekend getaways. It remains an anti-platform: useful, fast, and getting out of the way. 
