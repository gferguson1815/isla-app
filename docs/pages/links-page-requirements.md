# Links Page - Validated Requirements

## Page Layout Structure
- **Three-panel layout**: Icon sidebar (left), Navigation panel (middle), Main content area (right)
- **Current implementation**: Layout and design are correct as shown in Image #1
- **Empty state**: "No links yet" with "Create link" and "Learn more" buttons

## 1. Folder Navigation (Header Dropdown)
**Trigger**: Click "Links" button in main content header
**Display**: Dropdown menu showing:
- Search bar: "Search folders..."
- "View All" button - navigates to folders page (`/[workspace]/links/folders`)
- List of folders with folder icon
- Selected folder shows checkmark
- "Create new folder" option at bottom

## 2. Display Options (Display Button)
**Trigger**: Click "Display" button
**Menu Contents**:
- **View Toggle**: Cards / Rows (visual toggle)
- **Ordering**: Dropdown with "Date created" default
- **Show archived links**: Toggle switch
- **Display Properties** section:
  - Checkboxes for visible columns:
    - Short link
    - Destination URL
    - Title
    - Description
    - Created Date
    - Creator
    - Tags
    - Analytics

## 3. Search Functionality
- **Placeholder text**: "Search by short link or URL"
- **Location**: Top of main content area
- **Function**: Filter links by short link name or destination URL

## 4. Import/Export Menu (Three Dots)
**Trigger**: Click three dots button next to search
**Menu Sections**:

### Import Links
- Import from Bitly (with Bitly logo)
- Import from Rebrandly (with Rebrandly logo)
- Import from Short.io (with Short.io logo)
- Import from CSV (with spreadsheet icon)

### Export Links
- Export as CSV (with download icon)

## 5. Create Link Modal
**Trigger**:
- Click "Create link" button
- Keyboard shortcut
- Other create link CTAs

**Modal Structure**:
- **Header**: "Links > New link" breadcrumb with "Drafts" dropdown and close button
- **Blue border** around entire modal for focus

### Modal Fields (Left Column):
1. **Destination URL** (required)
   - Text input with URL validation
   - Tooltip icon for help

2. **Short Link**
   - Domain dropdown (e.g., "dub.sh")
   - Custom slug input field
   - Random slug generator button
   - Copy button
   - "Claim a free .link domain" promotional banner with "Claim Domain" button

3. **Tags**
   - "Select tags..." placeholder
   - Multi-select dropdown
   - "Manage" link to manage tags

4. **Comments**
   - Text area for internal notes
   - "Add comments" placeholder

5. **Conversion Tracking**
   - Collapsible section (collapsed by default)

### Modal Fields (Right Column):
1. **Folder**
   - Dropdown showing current folder (e.g., "Links")
   - Folder icon

2. **QR Code**
   - Generated QR code preview
   - Edit button (pencil icon)
   - Tooltip for help

3. **Custom Link Preview**
   - Preview card showing:
     - Social media icons (website, X/Twitter, LinkedIn, Facebook)
     - Image placeholder with "Enter a link to generate a preview" text
     - Edit button (pencil icon)
   - "Add a title..." link
   - "Add a description..." link

### Modal Footer (Bottom Tabs):
Tab buttons for additional options:
- UTM (with icon)
- Targeting (with icon)
- Password (with icon)
- Expiration (with icon)
- More options (...)

### Modal Actions:
- **Create link** button (black, bottom right)
- **Keyboard shortcut indicator** (⌘⏎)

## Key Behaviors
1. Modal appears as overlay with dark background
2. Blue border indicates active/focused state
3. All fields are optional except Destination URL
4. QR code generates automatically
5. Link preview updates as user enters URL
6. Random slug is pre-generated
7. Domain selection remembers last used

## Technical Notes
- Modal should be responsive
- Support keyboard navigation (Tab through fields)
- ESC key closes modal
- CMD+Enter creates link
- Form validation on submit
- Auto-save to drafts (indicated by "Drafts" dropdown)

## Next Steps
With these requirements validated, we can now:
1. Implement the folder dropdown functionality
2. Build the display options menu
3. Add search filtering
4. Create import/export functionality
5. Build the complete create link modal