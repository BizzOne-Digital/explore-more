# Requirements Document

## Introduction

This document specifies requirements for enhancing the Admin Dashboard Events management system. The enhancements will provide administrators with comprehensive control over event lifecycle management, including creation, editing, publishing, pricing configuration, and event duplication capabilities. The system will support both free and paid events with detailed event information including scheduling, capacity limits, registration deadlines, and contact details.

## Glossary

- **Admin_Dashboard**: The administrative interface where authorized administrators manage events
- **Event**: A scheduled activity with associated details such as name, description, date, time, location, and capacity
- **Event_Manager**: The system component responsible for creating, updating, and managing events
- **Draft_Event**: An event that has been created or saved but not published to the public website
- **Published_Event**: An event that is visible and accessible on the public website
- **Free_Event**: An event with no registration fee
- **Paid_Event**: An event that requires a registration fee in USD (dollar amount, not cents)
- **Event_Capacity**: The maximum number of registrants allowed for an event
- **Registration_Deadline**: The date and time after which event registration is no longer available
- **Unpublished_Event**: A previously published event that has been made invisible on the public website without deletion

## Requirements

### Requirement 1: Event Creation

**User Story:** As an administrator, I want to create new events with comprehensive details, so that I can provide complete information to potential attendees.

#### Acceptance Criteria

1. WHEN an administrator initiates event creation, THE Event_Manager SHALL create a new Event with the following fields: event name, description, date, start time, end time, location, image, contact information, capacity, registration deadline, and instructions
2. THE Event_Manager SHALL require event name, description, date, start time, and end time as mandatory fields
3. THE Event_Manager SHALL validate that the start time occurs before the end time
4. THE Event_Manager SHALL validate that the event date and registration deadline are valid future dates when creating new events
5. WHERE capacity is specified, THE Event_Manager SHALL validate that capacity is a positive integer greater than zero
6. THE Event_Manager SHALL store event images in a designated upload directory
7. THE Event_Manager SHALL create events in Draft_Event status by default

### Requirement 2: Event Pricing Configuration

**User Story:** As an administrator, I want to designate events as free or paid with pricing in USD dollars, so that I can properly configure registration fees.

#### Acceptance Criteria

1. WHEN creating or editing an Event, THE Admin_Dashboard SHALL allow the administrator to select either Free_Event or Paid_Event type
2. WHERE Paid_Event is selected, THE Event_Manager SHALL require a price amount in USD dollars (not cents)
3. THE Event_Manager SHALL validate that paid event amounts are positive decimal numbers with up to two decimal places
4. WHERE Free_Event is selected, THE Event_Manager SHALL store the price as zero or null
5. THE Event_Manager SHALL prevent changing event type from Paid_Event to Free_Event if registrations with payments already exist

### Requirement 3: Event Editing

**User Story:** As an administrator, I want to edit existing events, so that I can update event details as needed.

#### Acceptance Criteria

1. WHEN an administrator selects an existing Event, THE Admin_Dashboard SHALL display all event fields for modification
2. THE Event_Manager SHALL allow modification of all event fields including name, description, date, start time, end time, location, image, contact information, capacity, registration deadline, instructions, and pricing type
3. THE Event_Manager SHALL validate all modified fields using the same validation rules as event creation
4. WHEN an administrator updates an event image, THE Event_Manager SHALL replace the existing image file
5. THE Event_Manager SHALL preserve the existing publish status when saving edits
6. THE Event_Manager SHALL record the timestamp of the last modification

### Requirement 4: Event Deletion

**User Story:** As an administrator, I want to delete events, so that I can remove events that are no longer needed.

#### Acceptance Criteria

1. WHEN an administrator initiates event deletion, THE Admin_Dashboard SHALL display a confirmation dialog indicating whether the event has existing registrations
2. WHEN deletion is confirmed, THE Event_Manager SHALL permanently remove the Event and all associated data
3. THE Event_Manager SHALL delete associated event image files when an event is deleted
4. IF an Event has existing registrations, THEN THE Admin_Dashboard SHALL display a warning about data loss in the confirmation dialog
5. THE Event_Manager SHALL log all event deletions with administrator identifier and timestamp

### Requirement 5: Draft Management

**User Story:** As an administrator, I want to save events as drafts, so that I can prepare events before making them public.

#### Acceptance Criteria

1. THE Event_Manager SHALL allow saving events with Draft_Event status at any time during creation or editing
2. WHILE an Event has Draft_Event status, THE Event_Manager SHALL prevent the event from appearing on the public website
3. THE Admin_Dashboard SHALL display draft events distinctly from published events in the events list
4. THE Event_Manager SHALL allow multiple draft saves without publishing
5. THE Event_Manager SHALL preserve all event data in Draft_Event status including incomplete optional fields

### Requirement 6: Event Publishing

**User Story:** As an administrator, I want to publish events to the website, so that users can view and register for events.

#### Acceptance Criteria

1. WHEN an administrator initiates publishing of a Draft_Event or Unpublished_Event, THE Event_Manager SHALL validate that all mandatory fields are complete
2. IF mandatory fields are incomplete, THEN THE Event_Manager SHALL display specific validation errors and prevent publishing
3. WHEN publishing is successful, THE Event_Manager SHALL change the event status to Published_Event
4. WHEN an Event becomes a Published_Event, THE Event_Manager SHALL make the event visible on the public website immediately
5. THE Event_Manager SHALL record the publication timestamp
6. THE Event_Manager SHALL allow publishing of events that have passed their date for archival purposes

### Requirement 7: Event Unpublishing

**User Story:** As an administrator, I want to unpublish events without deleting them, so that I can temporarily remove events from public view while preserving event data.

#### Acceptance Criteria

1. WHEN an administrator initiates unpublishing of a Published_Event, THE Event_Manager SHALL change the event status to Unpublished_Event
2. WHEN an Event becomes an Unpublished_Event, THE Event_Manager SHALL remove the event from the public website immediately
3. THE Event_Manager SHALL preserve all event data including registrations when unpublishing
4. THE Admin_Dashboard SHALL display unpublished events distinctly from published and draft events
5. THE Event_Manager SHALL allow re-publishing of Unpublished_Event instances
6. THE Event_Manager SHALL record the unpublish timestamp

### Requirement 8: Event Duplication

**User Story:** As an administrator, I want to duplicate existing events, so that I can quickly create similar events for future dates.

#### Acceptance Criteria

1. WHEN an administrator initiates event duplication, THE Event_Manager SHALL create a new Draft_Event with all field values copied from the source event
2. THE Event_Manager SHALL append a distinguishing suffix to the duplicated event name (e.g., " - Copy")
3. THE Event_Manager SHALL copy the event image file to a new file for the duplicated event
4. THE Event_Manager SHALL not copy existing registrations to the duplicated event
5. THE Event_Manager SHALL not copy publication status to the duplicated event (new event starts as Draft_Event)
6. THE Event_Manager SHALL allow the administrator to edit the duplicated event immediately after creation
7. THE Event_Manager SHALL preserve the pricing type (Free_Event or Paid_Event) and amount in the duplicated event

### Requirement 9: Event List Management

**User Story:** As an administrator, I want to view all events with their status, so that I can manage events efficiently.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display a list of all events including Draft_Event, Published_Event, and Unpublished_Event instances
2. THE Admin_Dashboard SHALL display for each event: name, date, start time, status, pricing type, and capacity information
3. THE Admin_Dashboard SHALL allow filtering events by status (draft, published, unpublished)
4. THE Admin_Dashboard SHALL allow sorting events by date, name, or creation timestamp
5. THE Admin_Dashboard SHALL display visual indicators for past events
6. THE Admin_Dashboard SHALL provide quick actions for each event including edit, delete, duplicate, publish/unpublish

### Requirement 10: Event Data Validation

**User Story:** As an administrator, I want the system to validate event data, so that I can ensure data quality and consistency.

#### Acceptance Criteria

1. THE Event_Manager SHALL validate that event names are between 3 and 200 characters
2. THE Event_Manager SHALL validate that event descriptions are between 10 and 5000 characters
3. THE Event_Manager SHALL validate that start time occurs before end time on the event date
4. THE Event_Manager SHALL validate that registration deadline occurs before or on the event start date and time
5. THE Event_Manager SHALL validate that contact information includes valid email format if email is provided
6. THE Event_Manager SHALL validate that image uploads are in supported formats (JPEG, PNG, WebP)
7. THE Event_Manager SHALL validate that image file sizes do not exceed 5MB
8. IF validation fails, THEN THE Event_Manager SHALL display specific error messages identifying the invalid fields

### Requirement 11: Event Image Management

**User Story:** As an administrator, I want to manage event images, so that events have appropriate visual representation.

#### Acceptance Criteria

1. WHEN an administrator uploads an event image, THE Event_Manager SHALL store the image in the designated events upload directory
2. THE Event_Manager SHALL generate a unique filename for each uploaded image to prevent conflicts
3. THE Event_Manager SHALL validate image file format and size before accepting uploads
4. WHERE an event has an existing image, THE Admin_Dashboard SHALL display a thumbnail preview
5. THE Event_Manager SHALL allow removing an event image without deleting the entire event
6. WHEN an event image is replaced, THE Event_Manager SHALL delete the previous image file
7. THE Event_Manager SHALL serve images optimized for web display on the public website

### Requirement 12: Registration Capacity Management

**User Story:** As an administrator, I want to set event capacity limits, so that I can control the number of attendees.

#### Acceptance Criteria

1. WHERE capacity is specified, THE Event_Manager SHALL track the current registration count against the capacity limit
2. THE Admin_Dashboard SHALL display the current registration count and remaining capacity for each event
3. THE Event_Manager SHALL prevent reducing capacity below the current registration count when editing events
4. WHERE capacity is set to zero or null, THE Event_Manager SHALL treat the event as having unlimited capacity
5. IF capacity is specified and reached, THEN THE Event_Manager SHALL display "Full" status on the public website
