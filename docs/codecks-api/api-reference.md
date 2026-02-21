# Api Reference

The Codecks API is heavily inspired by [GraphQL](https://graphql.org/). When Codecks was started, only the idea of GraphQL has been around, but no implementation. So Codecks developed its own JSON-based querying language.

This reference only covers read operations. Please refer to the [Quick Guide to Codecks API](/api/) for information about write operations.

## Basics

simple syntax example:

```
{
  "_root": [{
    "relname($query)": [...fields and relations],
    "relname($query2)": [...fields and relations],
  }]
}
```

curl example:

```
curl 'https://api.codecks.io/' \
  -H 'X-Account: [SUBDOMAIN]' \
  -H 'Content-Type: application/json' \
  -H 'X-Auth-Token: [TOKEN]' \
  --data-binary '{"query":{"_root":[{"account":["name"]}]}}'
```

The Token corresponds to the value of the `at` cookie sent to `api.codecks.io` requests. A feature for dedicated API-Tokens is planned.

## `relname($query)`

here’s the syntax for what a `$query` looks like.

```
{fieldName1: $val, fieldName2: {"op": $op, "value": $val}}
```

Note that `{fieldName1: $val}` is a shortcut for `{fieldName1: {"op": "eq", "value": $val}}`

The `$query` portion needs to be sent to `JSON.stringify()` or similar. For readiablity’s sake we display the non-stringified versions here.

If you want to fetch all related items you can leave out the `$query` portion like this:

```
...
"deck": [{
  "cards": [...fields and relations],
}]
...
```

### Possible values for `$op`

- `eq`: value \| null
- `neq`: value \| null
- `in`: array
- `notIn`: array
- `gt`: ordinal value
- `gte`: ordinal value
- `lt`: ordinal value
- `lte`: ordinal value
- `inOrNull`: array
- `contains`: string (if field is of type string)
- `has`: value (if field is of type array)
- `overlaps`: array (if field is of type array)
- `search`: string if field is searchable (so far only available for the `content` field within the `card` model)

### Filtering by values of relation fields

`fieldName` can also be used to access a relation’s properties. For a `card` this could be e.g `{resolvables: {context: ["block", "review"], isClosed: false}}`. This would fetch all cards that have at least one non-closed resolvable with the `block`or`review` context

**Negation:**

you can also do `{!resolvables: {context: ["block", "review"], isClosed: false}}` to say only show cards with *no* such resolvables.

### ”in” - shortcut

```
relname({"projectId": [123, 234]})
```

is equivalent to

```
relname({"projectId": {"op": "in", value: [123, 234]}})
```

### special fields

- `$or` combines multiple queries via `or`, sub queries may not contain special fields (beside more \$or and \$and)

  ```
  relname({"$or": [{"isArchived": true}, {"status": "done"}]})
  ```

- `$and` combines multiple queries via `and`, sub queries may not contain special fields (beside more \$or and \$and)

  ```
  relname({"$and": [
    {"effort": {"op": "gt", value: 0}},
    {"effort": {"op": "lte", value: 5}}
  ]})
  ```

- `$order`: OrderExpression

  ```
  relname({"deckId": 123, "$order": "createdAt"})
  ```

  Full OrderExpression is `{"field": fieldName, "dir": "desc"|"asc"}[]`

  Shortcuts are

  - `{"field": fieldName, "dir": "desc"|"asc"}` -\> \[`{"field": fieldName, "dir": "desc"|"asc"}`\]
  - `fieldName` -\> \[`{"field": fieldName, "dir": "asc"}`\]
  - `-fieldName` -\> \[`{"field": fieldName, "dir": "desc"}`\]

- `$first`: true

  only works when order is provided, return singleton

  ```
  relname({"deckId": 123, "$order": "createdAt", "$first": true})
  ```

- `$limit`: number

  only works when order is provided, there’s always a maximum \$limit of 3000

  ```
  relname({"deckId": 123, "$order": "createdAt", "$limit": 10})
  ```

- `$offset`: number

  only works when limit (and thus order) is provided

  ```
  relname({"deckId": 123, "$order": "createdAt", "$limit": 10, "$offset": 20})
  ```

## root level id-based queries

root level queries look like this:

```
{
  "modelname($id)": [...fields and relations]
}
```

`$id` is either a string for single id models or a JSON array for compound ids.

## The API Reference

Below is a raw output of all available models, their fields and relations.

Note that this information should not be considered stable. While most properties haven’t changed in years, there’s no guarantee they won’t change in the future.

## [\_root](#_root)

### Relations

releases

[release[]](#release)

accountOnboardingSteps

[accountOnboardingStep[]](#accountOnboardingStep)

apps

[app[]](#app)

account

[account](#account)

loggedInUser

[user](#user)

cardsStatusHistory

[cardsStatusHistory[]](#cardsStatusHistory)

cardsEffortHistory

[cardsEffortHistory[]](#cardsEffortHistory)

cardsFinishedHistory

[cardsFinishedHistory[]](#cardsFinishedHistory)

cardsTimeToFinished

[cardsTimeToFinished[]](#cardsTimeToFinished)

## [accountOnboardingStep](#accountOnboardingStep)

### Fields

chapter

string

description

string

milestone

string

roles

array

sortValue

string

status

string

title

string

variants

array

xp

int

## [accountOnboarding](#accountOnboarding)

### Fields

account

[account](#account)

steps

json

variants

array

## [accountRole](#accountRole)

### Fields

account

[account](#account)

createdAt

date

lastChangedAt

date

role

string

roleAsPrio

int

user

[user](#user)

## [accountUserAchievement](#accountUserAchievement)

### Fields

account

[account](#account)

context

json

user

[user](#user)

value

json

## [accountUserSetting](#accountUserSetting)

### Fields

account

[account](#account)

inboxDeck

[deck](#deck)

startWeekdayOverwrite

unknown

timelineScaleTypeOverwrite

unknown

user

[user](#user)

wantsWeeklyDigestMail

bool

## [account](#account)

### Fields

activeFeatureFlags

json

activeProjectCount

int

allowInheritHeroCover

bool

attachmentCoverMode

string

billingCity

string

billingCountryCode

string

billingEmail

string

billingLine1

string

billingLine2

string

billingName

string

billingType

string

billingZip

string

coupon

json

createdAt

date

defaultInboxDeck

[deck](#deck)

dependenciesEnabled

bool

disabledAt

date

disabledBy

[user](#user)

effortScale

json

fallbackEffort

int

hideCompletedCardCountForDecks

bool

isDisabled

bool

isLearning

bool

isNonProfit

bool

maxHandSlotCount

int

maxTimeTrackingSegmentMsDuration

int

milestonesEnabled

bool

name

string

netGiftAmount

int

offeringTrial

bool

persona

string

planOverwrites

json

priorityLabels

json

seats

int

sprintsEnabled

bool

staffPermission

string

staffQuestMode

string

startWeekday

string

statusChangeDurations

json

subdomain

string

timeTrackingMode

string

timeTrackingSwimLaneInfo

bool

timelineScaleType

string

totalMediaByteUsage

bigint

visionBoardEnabled

bool

workdays

json

workflowMode

string

### Relations

cards

[card[]](#card)

invoices

[invoice[]](#invoice)

cardPresets

[cardPreset[]](#cardPreset)

attachments

[attachment[]](#attachment)

discordGuilds

[discordGuild[]](#discordGuild)

timeTrackingSegments

[timeTrackingSegment[]](#timeTrackingSegment)

workflowItems

[workflowItem[]](#workflowItem)

deckAssignments

[deckAssignment[]](#deckAssignment)

assigneeAssignments

[assigneeAssignment[]](#assigneeAssignment)

assigneeDeckAssignments

[assigneeDeckAssignment[]](#assigneeDeckAssignment)

wizards

[wizard[]](#wizard)

milestones

[milestone[]](#milestone)

sprints

[sprint[]](#sprint)

sprintConfigs

[sprintConfig[]](#sprintConfig)

handCards

[handCard[]](#handCard)

resolvables

[resolvable[]](#resolvable)

cardUpvotes

[cardUpvote[]](#cardUpvote)

resolvableParticipants

[resolvableParticipant[]](#resolvableParticipant)

userReportSettings

[userReportSetting[]](#userReportSetting)

cardOrders

[cardOrder[]](#cardOrder)

accountUserAchievements

[accountUserAchievement[]](#accountUserAchievement)

userInviteCodes

[userInviteCode[]](#userInviteCode)

visionBoards

[visionBoard[]](#visionBoard)

deckSubscriptions

[deckSubscription[]](#deckSubscription)

appInstallations

[appInstallation[]](#appInstallation)

files

[file[]](#file)

decks

[deck[]](#deck)

queueEntries

[queueEntry[]](#queueEntry)

visionBoardQueries

[visionBoardQuery[]](#visionBoardQuery)

anyDecks

[deck[]](#deck)

projects

[project[]](#project)

archivedProjects

[project[]](#project)

anyProjects

[project[]](#project)

roles

[accountRole[]](#accountRole)

invitations

[userInvitation[]](#userInvitation)

githubIntegration

[integration](#integration)

slackIntegration

[integration](#integration)

affiliateCodes

[affiliateCode[]](#affiliateCode)

activities

[activity[]](#activity)

stripeAccountSync

[stripeAccountSync](#stripeAccountSync)

accountOnboarding

[accountOnboarding](#accountOnboarding)

## [activeTimeTracker](#activeTimeTracker)

### Fields

account

[account](#account)

card

[card](#card)

createdAt

date

user

[user](#user)

## [activity](#activity)

### Fields

card

[card](#card)

changer

[user](#user)

createdAt

date

data

json

deck

[deck](#deck)

isRemovedFromDeckEntry

bool

isRemovedFromMilestoneEntry

bool

isRemovedFromSprintEntry

bool

milestone

[milestone](#milestone)

project

[project](#project)

sprint

[sprint](#sprint)

type

string

## [affiliateCodeStat](#affiliateCodeStat)

### Fields

affiliateCode

[affiliateCode](#affiliateCode)

month

int

newVisitors

int

revenue

int

signups

int

visits

int

year

int

## [affiliateCode](#affiliateCode)

### Fields

account

[account](#account)

code

string

createdAt

date

creator

[user](#user)

isDeleted

bool

isDisabled

bool

label

string

message

string

remainingRedemptions

int

reward

json

validUntil

unknown

vanityUrl

string

### Relations

stats

[affiliateCodeStat[]](#affiliateCodeStat)

## [appInstallation](#appInstallation)

### Fields

account

[account](#account)

app

[app](#app)

createdAt

date

installer

[user](#user)

## [app](#app)

### Fields

createdAt

date

name

string

payload

json

## [assigneeAssignment](#assigneeAssignment)

### Fields

account

[account](#account)

assignedBy

[user](#user)

assignee

[user](#user)

lastAssignedAt

date

## [assigneeDeckAssignment](#assigneeDeckAssignment)

### Fields

account

[account](#account)

assignedBy

[user](#user)

assignee

[user](#user)

deck

[deck](#deck)

lastAssignedAt

date

## [attachment](#attachment)

### Fields

account

[account](#account)

card

[card](#card)

content

string

createdAt

date

creator

[user](#user)

file

[file](#file)

title

string

## [autoFinishedTimeTrackingSegment](#autoFinishedTimeTrackingSegment)

### Fields

account

[account](#account)

card

[card](#card)

createdAt

date

timeTrackingSegment

[timeTrackingSegment](#timeTrackingSegment)

user

[user](#user)

## [cardDiffNotification](#cardDiffNotification)

### Fields

account

[account](#account)

asOwner

bool

card

[card](#card)

changers

array

changes

json

createdAt

date

lastUpdatedAt

date

user

[user](#user)

## [cardHistory](#cardHistory)

### Fields

account

[account](#account)

card

[card](#card)

changer

[user](#user)

diff

json

version

int

versionCreatedAt

date

## [cardOrderInDeck](#cardOrderInDeck)

### Fields

card

[card](#card)

changer

[user](#user)

deck

[deck](#deck)

sortIndex

string

## [cardOrder](#cardOrder)

### Fields

account

[account](#account)

card

[card](#card)

label

string

sortValue

string

## [cardPreset](#cardPreset)

### Fields

account

[account](#account)

createdAt

date

creator

[user](#user)

data

json

name

string

## [cardSubscription](#cardSubscription)

### Fields

account

[account](#account)

card

[card](#card)

createdAt

date

user

[user](#user)

## [cardUpvote](#cardUpvote)

### Fields

account

[account](#account)

card

[card](#card)

createdAt

date

discordUserInfo

json

type

string

user

[user](#user)

## [card](#card)

### Fields

account

[account](#account)

accountSeq

int

assignee

[user](#user)

checkboxInfo

array

checkboxStats

json

childCardInfo

string

content

string

coverFile

[file](#file)

createdAt

date

creator

[user](#user)

deck

[deck](#deck)

derivedStatus

string

discordGuild

[discordGuild](#discordGuild)

dueDate

day

effort

int

embeds

json

hasBlockingDeps

bool

isDoc

bool

isPublic

bool

lastUpdatedAt

date

legacyProject

[project](#project)

legacyProjectSeq

int

masterTags

array

mentionedUsers

array

meta

json

milestone

[milestone](#milestone)

parentCard

[card](#card)

priority

unknown

sourceWorkflowItem

[workflowItem](#workflowItem)

sprint

[sprint](#sprint)

status

string

tags

array

title

string

version

int

visibility

string

visionBoard

[visionBoard](#visionBoard)

### Relations

resolvables

[resolvable[]](#resolvable)

handCards

[handCard[]](#handCard)

timeTrackingSegments

[timeTrackingSegment[]](#timeTrackingSegment)

cardSubscriptions

[cardSubscription[]](#cardSubscription)

cardOrders

[cardOrder[]](#cardOrder)

resolvableEntries

[resolvableEntry[]](#resolvableEntry)

queueEntries

[queueEntry[]](#queueEntry)

attachments

[attachment[]](#attachment)

diffs

[cardHistory[]](#cardHistory)

totalTimeTrackingSums

[timeTrackingSum](#timeTrackingSum)

userTimeTrackingSums

[timeTrackingSum[]](#timeTrackingSum)

childCards

[card[]](#card)

inDeps

[card[]](#card)

outDeps

[card[]](#card)

cardReferences

[card[]](#card)

upvotes

[cardUpvote[]](#cardUpvote)

## [cardsEffortHistory](#cardsEffortHistory)

### Fields

cardCount

bigint

date

day

effortSum

bigint

## [cardsFinishedHistory](#cardsFinishedHistory)

### Fields

assignee

[user](#user)

cardCount

bigint

date

day

effortSum

bigint

## [cardsStatusHistory](#cardsStatusHistory)

### Fields

count

int

date

day

status

string

## [cardsTimeToFinished](#cardsTimeToFinished)

### Fields

assignee

[user](#user)

card

[card](#card)

doneAt

date

effort

int

startedAt

date

## [dailyDiscordGuildVoteMembership](#dailyDiscordGuildVoteMembership)

### Fields

discordGuild

[discordGuild](#discordGuild)

membershipCount

int

t

date

## [dailyPublicProjectMembership](#dailyPublicProjectMembership)

### Fields

membershipCount

int

project

[project](#project)

t

date

## [publicProjectVisit](#publicProjectVisit)

### Fields

project

[project](#project)

t

date

topReferrers

json

visitCounts

int

## [deckAssignment](#deckAssignment)

### Fields

account

[account](#account)

deck

[deck](#deck)

lastAssignedAt

date

user

[user](#user)

## [deckGuardian](#deckGuardian)

### Fields

account

[account](#account)

deck

[deck](#deck)

user

[user](#user)

## [deckSubscription](#deckSubscription)

### Fields

account

[account](#account)

deck

[deck](#deck)

user

[user](#user)

## [deck](#deck)

### Fields

account

[account](#account)

accountSeq

int

content

string

coverColor

unknown

coverFile

[file](#file)

createdAt

date

creator

[user](#user)

deckType

string

defaultCard

json

defaultProjectTag

[projectTag](#projectTag)

description

string

descriptionCoverFile

[file](#file)

handSyncEnabled

bool

hasGuardians

bool

isDeleted

bool

isOnboardingDeck

bool

manualOrderLabels

json

milestone

[milestone](#milestone)

preferredOrder

unknown

project

[project](#project)

sortValue

string

spaceId

int

stats

json

stickyDefaultProjectTag

bool

title

string

workflowItemOrderLabels

json

### Relations

cards

[card[]](#card)

workflowItems

[workflowItem[]](#workflowItem)

cardOrderInDecks

[cardOrderInDeck[]](#cardOrderInDeck)

activities

[activity[]](#activity)

guardians

[deckGuardian[]](#deckGuardian)

## [discordGuild](#discordGuild)

### Fields

account

[account](#account)

createdAt

date

discordGuildId

string

guildIconId

string

guildName

string

karmaRoleThresholds

json

removeCommandEmoji

string

removeCommandEnabled

string

removeCommandRoleId

string

scope

string

userMapping

json

### Relations

slashCommands

[discordSlashCommand[]](#discordSlashCommand)

projectNotifications

[discordProjectNotification[]](#discordProjectNotification)

dailyDiscordGuildVoteMemberships

[dailyDiscordGuildVoteMembership[]](#dailyDiscordGuildVoteMembership)

members

[discordMember[]](#discordMember)

## [discordMember](#discordMember)

### Fields

avatar

string

createdAt

date

deckyScore

int

discordGuild

[discordGuild](#discordGuild)

discordUserId

string

discriminator

string

name

string

nick

string

## [discordProjectNotification](#discordProjectNotification)

### Fields

createdAt

date

disabledTypes

json

discordChannelId

string

discordGuild

[discordGuild](#discordGuild)

project

[project](#project)

## [discordSlashCommand](#discordSlashCommand)

### Fields

autoAddRoleToThread

string

channelId

string

deck

[deck](#deck)

description

string

discordGuild

[discordGuild](#discordGuild)

karmaForCompletion

int

leaderboard

json

maxFileSizeInBytes

int

name

string

permissions

json

reaction

string

reactionThreshold

int

statusMessages

json

statusTargetChannelId

string

## [dueCard](#dueCard)

### Fields

account

[account](#account)

card

[card](#card)

createdAt

date

user

[user](#user)

## [file](#file)

### Fields

account

[account](#account)

createdAt

date

deletedAt

date

deletedBy

[user](#user)

isDeleted

bool

meta

json

name

string

selfHosted

bool

size

string

uploader

[user](#user)

url

string

## [handCard](#handCard)

### Fields

account

[account](#account)

card

[card](#card)

sortIndex

int

user

[user](#user)

## [integration](#integration)

### Fields

account

[account](#account)

createdAt

date

creator

[user](#user)

disabled

string

type

string

user

[user](#user)

userData

json

version

int

## [invoice](#invoice)

### Fields

account

[account](#account)

chargeData

json

charged

int

createdAt

date

invoiceNumber

string

subtotal

int

total

int

url

string

## [lastSeenCardUpvote](#lastSeenCardUpvote)

### Fields

account

[account](#account)

createdAt

date

lastSeenAt

date

user

[user](#user)

## [milestoneProgress](#milestoneProgress)

### Fields

milestone

[milestone](#milestone)

progress

json

## [milestoneProject](#milestoneProject)

### Fields

account

[account](#account)

milestone

[milestone](#milestone)

project

[project](#project)

## [milestone](#milestone)

### Fields

account

[account](#account)

accountSeq

int

color

string

coverFile

[file](#file)

createdAt

date

creator

[user](#user)

date

day

description

unknown

handSyncEnabled

bool

isDeleted

bool

isGlobal

bool

manualOrderLabels

json

name

string

preferredOrder

unknown

startDate

day

stats

json

userCapacities

json

### Relations

milestoneProjects

[milestoneProject[]](#milestoneProject)

cards

[card[]](#card)

activities

[activity[]](#activity)

progress

[milestoneProgress[]](#milestoneProgress)

## [pinnedMilestone](#pinnedMilestone)

### Fields

account

[account](#account)

milestone

[milestone](#milestone)

sprint

[sprint](#sprint)

user

[user](#user)

## [projectOrder](#projectOrder)

### Fields

account

[account](#account)

project

[project](#project)

sortIndex

int

user

[user](#user)

## [projectSelection](#projectSelection)

### Fields

account

[account](#account)

project

[project](#project)

user

[user](#user)

## [projectTag](#projectTag)

### Fields

color

string

createdAt

date

description

string

emoji

string

project

[project](#project)

tag

string

## [projectUserSetting](#projectUserSetting)

### Fields

project

[project](#project)

user

[user](#user)

## [projectUser](#projectUser)

### Fields

account

[account](#account)

project

[project](#project)

projectRole

string

user

[user](#user)

## [project](#project)

### Fields

account

[account](#account)

accountSeq

int

allowUpvotes

bool

commentsArePublic

bool

coverFile

[file](#file)

createdAt

date

defaultUserAccess

string

effortIcon

unknown

isPublic

bool

markerColor

unknown

name

string

publicBackgroundColor

string

publicBackgroundImage

[file](#file)

publicBannerFile

[file](#file)

publicHeading

string

publicIsExplicit

bool

publicLayoutVersion

int

publicMessage

string

publicPath

string

publicRegistryAgreement

bool

publicTileFile

[file](#file)

spaces

json

visibility

string

### Relations

decks

[deck[]](#deck)

milestoneProjects

[milestoneProject[]](#milestoneProject)

sprintProjects

[sprintProject[]](#sprintProject)

publicProjectVisits

[publicProjectVisit[]](#publicProjectVisit)

dailyPublicProjectMembership

[dailyPublicProjectMembership[]](#dailyPublicProjectMembership)

publicProjectMemberships

[publicProjectMembership[]](#publicProjectMembership)

cardUpvotes

[cardUpvote[]](#cardUpvote)

tags

[projectTag[]](#projectTag)

activities

[activity[]](#activity)

explicitProjectUsers

[projectUser[]](#projectUser)

access

[userProjectAccess[]](#userProjectAccess)

publicProjectInfo

[publicProjectInfo](#publicProjectInfo)

## [publicProjectInfo](#publicProjectInfo)

### Fields

account

[account](#account)

activities7d

string

cardCount

string

cardDoneStreak

string

lastActivityAt

string

project

[project](#project)

visits7d

string

## [publicProjectMembership](#publicProjectMembership)

### Fields

createdAt

date

digestFrequencyInDays

int

project

[project](#project)

user

[user](#user)

## [queueEntry](#queueEntry)

### Fields

account

[account](#account)

card

[card](#card)

cardDoneAt

date

createdAt

date

sortIndex

int

user

[user](#user)

## [queueSelection](#queueSelection)

### Fields

account

[account](#account)

queueUser

[user](#user)

sortIndex

int

user

[user](#user)

## [release](#release)

### Fields

content

string

createdAt

date

isLive

string

title

string

version

string

## [resolvableEntryHistory](#resolvableEntryHistory)

### Fields

author

[user](#user)

content

string

entry

[resolvableEntry](#resolvableEntry)

lastChangedAt

date

resolvable

[resolvable](#resolvable)

version

int

## [resolvableEntryReaction](#resolvableEntryReaction)

### Fields

account

[account](#account)

createdAt

date

isPublic

bool

resolvable

[resolvable](#resolvable)

resolvableEntry

[resolvableEntry](#resolvableEntry)

user

[user](#user)

value

json

## [resolvableEntry](#resolvableEntry)

### Fields

author

[user](#user)

card

[card](#card)

content

string

createdAt

date

lastChangedAt

date

meta

json

resolvable

[resolvable](#resolvable)

version

int

### Relations

reactions

[resolvableEntryReaction[]](#resolvableEntryReaction)

histories

[resolvableEntryHistory[]](#resolvableEntryHistory)

## [resolvableNotification](#resolvableNotification)

### Fields

account

[account](#account)

createdAt

date

isLastParticipant

bool

isParticipating

bool

isSnoozing

bool

lastUpdatedAt

date

latestEntry

[resolvableEntry](#resolvableEntry)

latestSeenEntry

[resolvableEntry](#resolvableEntry)

remindMeOn

date

resolvable

[resolvable](#resolvable)

snoozeUntil

date

unseenAuthors

array

unseenEntryCount

int

user

[user](#user)

## [resolvableParticipantHistory](#resolvableParticipantHistory)

### Fields

addedBy

[user](#user)

done

bool

firstJoinedAt

string

lastChangedAt

date

reaction

string

resolvable

[resolvable](#resolvable)

status

string

user

[user](#user)

version

int

## [resolvableParticipant](#resolvableParticipant)

### Fields

account

[account](#account)

addedBy

[user](#user)

discordUserId

string

done

bool

firstJoinedAt

date

lastChangedAt

date

resolvable

[resolvable](#resolvable)

resolvableIsClosed

bool

status

string

user

[user](#user)

## [resolvable](#resolvable)

### Fields

account

[account](#account)

card

[card](#card)

closedAt

date

closedBy

[user](#user)

context

string

contextAsPrio

int

createdAt

date

creator

[user](#user)

isClosed

bool

isPublic

bool

### Relations

participants

[resolvableParticipant[]](#resolvableParticipant)

participantHistories

[resolvableParticipantHistory[]](#resolvableParticipantHistory)

entries

[resolvableEntry[]](#resolvableEntry)

## [savedSearch](#savedSearch)

### Fields

account

[account](#account)

forceOr

bool

owner

[user](#user)

tokens

array

## [sprintConfigProgress](#sprintConfigProgress)

### Fields

progress

json

sprintConfig

[sprintConfig](#sprintConfig)

## [sprintConfig](#sprintConfig)

### Fields

account

[account](#account)

autoAssignNewCard

bool

autoAssignStartedCard

bool

autoBeastModeDurationHours

int

beastGracePeriodHours

int

color

string

createdAt

date

creator

[user](#user)

endHour

int

endHourTimezone

string

isGlobal

bool

moveOnFinish

json

name

string

preferredOrder

unknown

sprintDurationWeeks

int

sprintStartWeekday

int

stopOn

day

upcomingSprints

int

### Relations

sprintProjects

[sprintProject[]](#sprintProject)

sprints

[sprint[]](#sprint)

progress

[sprintConfigProgress[]](#sprintConfigProgress)

## [sprintProgress](#sprintProgress)

### Fields

progress

json

sprint

[sprint](#sprint)

## [sprintProject](#sprintProject)

### Fields

account

[account](#account)

project

[project](#project)

sprintConfig

[sprintConfig](#sprintConfig)

## [sprint](#sprint)

### Fields

account

[account](#account)

accountSeq

int

autoMilestone

[milestone](#milestone)

completedAt

date

coverFile

[file](#file)

createdAt

date

creator

[user](#user)

description

string

endDate

day

handSyncEnabled

bool

index

int

isDeleted

bool

lockedAt

date

manualOrderLabels

json

name

string

sprintConfig

[sprintConfig](#sprintConfig)

startDate

day

stats

json

userCapacities

json

### Relations

cards

[card[]](#card)

progress

[sprintProgress[]](#sprintProgress)

activities

[activity[]](#activity)

## [stripeAccountSync](#stripeAccountSync)

### Fields

account

[account](#account)

billingCycleEnd

date

billingCycleStart

date

centsPerSeat

int

euVatIdData

json

grossActualBalance

int

grossBonusBalance

int

hasBeenCancelledAt

date

netGiftBalance

int

paymentMethod

json

pendingPlanType

string

planName

string

planType

string

repeatingCoupon

json

status

string

vatCountryCode

string

vatTaxPercentage

int

## [timeTrackingSegment](#timeTrackingSegment)

### Fields

account

[account](#account)

addedManually

bool

autoFinishedState

string

card

[card](#card)

createdAt

date

finishedAt

date

modifyDurationMsBy

int

startedAt

date

user

[user](#user)

## [timeTrackingSum](#timeTrackingSum)

### Fields

card

[card](#card)

runningModifyDurationMsBy

int

runningStartedAt

date

sumMs

int

user

[user](#user)

## [userDismissedHint](#userDismissedHint)

### Fields

createdAt

date

hintKey

string

returnAt

date

user

[user](#user)

## [userEmail](#userEmail)

### Fields

createdAt

date

email

string

isPrimary

bool

isVerified

bool

user

[user](#user)

## [userInvitation](#userInvitation)

### Fields

accessToProjectIds

array

account

[account](#account)

createdAt

date

email

string

inviter

[user](#user)

role

string

## [userInviteCode](#userInviteCode)

### Fields

accessToProjectIds

array

account

[account](#account)

createdAt

date

creator

[user](#user)

isActive

bool

role

string

token

string

useCount

int

validUntil

date

## [userNotificationChannel](#userNotificationChannel)

### Fields

account

[account](#account)

channelType

string

createdAt

date

user

[user](#user)

## [userOnboarding](#userOnboarding)

### Fields

steps

json

user

[user](#user)

## [userProjectAccess](#userProjectAccess)

### Fields

project

[project](#project)

projectRole

string

role

string

user

[user](#user)

## [userTag](#userTag)

### Fields

account

[account](#account)

createdAt

date

tag

string

user

[user](#user)

## [user](#user)

### Fields

autoMeFilterCardLimit

int

cdxRole

string

createdAt

date

disableAnimations

bool

disableMovingImages

bool

enableClickToEditCards

bool

fullName

unknown

hasPassword

bool

isIntegration

bool

lastSeenRelease

[release](#release)

name

string

profileImage

[file](#file)

showCardIdInTimer

bool

statusColorPalette

string

timezone

string

wantsConvoDigestMail

bool

wantsDailyDigestMail

bool

wantsNewsletter

bool

### Relations

projectOrders

[projectOrder[]](#projectOrder)

projectSelections

[projectSelection[]](#projectSelection)

queueSelections

[queueSelection[]](#queueSelection)

accountRoles

[accountRole[]](#accountRole)

cardDiffNotifications

[cardDiffNotification[]](#cardDiffNotification)

resolvableNotifications

[resolvableNotification[]](#resolvableNotification)

publicProjectMembership

[publicProjectMembership[]](#publicProjectMembership)

lastSeenCardUpvotes

[lastSeenCardUpvote[]](#lastSeenCardUpvote)

dueCards

[dueCard[]](#dueCard)

assigneeDeckAssignments

[assigneeDeckAssignment[]](#assigneeDeckAssignment)

autoFinishedTimeTrackingSegments

[autoFinishedTimeTrackingSegment[]](#autoFinishedTimeTrackingSegment)

savedSearches

[savedSearch[]](#savedSearch)

activities

[activity[]](#activity)

emails

[userEmail[]](#userEmail)

tags

[userTag[]](#userTag)

unverifiedEmails

[userEmail[]](#userEmail)

primaryEmail

[userEmail](#userEmail)

pinnedMilestoneNext

[pinnedMilestone](#pinnedMilestone)

explicitProjectAccess

[projectUser[]](#projectUser)

withProjectAccess

[userProjectAccess[]](#userProjectAccess)

projectSettings

[projectUserSetting[]](#projectUserSetting)

accountSettings

[accountUserSetting[]](#accountUserSetting)

dismissedHints

[userDismissedHint[]](#userDismissedHint)

slackIntegrations

[integration[]](#integration)

activeTimeTracker

[activeTimeTracker](#activeTimeTracker)

participations

[resolvableParticipant[]](#resolvableParticipant)

upvotes

[cardUpvote[]](#cardUpvote)

notificationChannels

[userNotificationChannel[]](#userNotificationChannel)

userOnboarding

[userOnboarding](#userOnboarding)

## [userReportEmail](#userReportEmail)

### Fields

account

[account](#account)

createdAt

date

email

string

enabled

string

userReportSetting

[userReportSetting](#userReportSetting)

## [userReportSetting](#userReportSetting)

### Fields

account

[account](#account)

createdAt

date

deckMapping

json

fileSizeBytesLimit

bigint

name

string

prioMapping

json

### Relations

reportTokens

[userReportToken[]](#userReportToken)

## [userReportToken](#userReportToken)

### Fields

createdAt

date

enabled

string

label

string

reportCount

int

userReportSetting

[userReportSetting](#userReportSetting)

## [visionBoardQuery](#visionBoardQuery)

### Fields

account

[account](#account)

card

[card](#card)

createdAt

date

isStale

bool

lastUsedAt

date

payload

json

query

json

type

string

## [visionBoard](#visionBoard)

### Fields

account

[account](#account)

accountSeq

int

card

[card](#card)

createdAt

date

creator

[user](#user)

isDeleted

bool

## [wizard](#wizard)

### Fields

account

[account](#account)

createdAt

date

currentStep

string

data

json

finishedAt

date

name

string

## [workflowItemHistory](#workflowItemHistory)

### Fields

account

[account](#account)

changer

[user](#user)

diff

json

version

int

versionCreatedAt

date

## [workflowItem](#workflowItem)

### Fields

account

[account](#account)

accountSeq

int

assignee

[user](#user)

checkboxInfo

array

checkboxStats

json

content

string

createdAt

date

creator

[user](#user)

deck

[deck](#deck)

effort

int

label

string

lastUpdatedAt

date

masterTags

array

mentionedUsers

array

priority

unknown

sortOrder

string

sortValue

string

tags

array

targetDeck

[deck](#deck)

title

string

version

string

visibility

string

### Relations

diffs

[workflowItemHistory[]](#workflowItemHistory)

inDeps

[workflowItem[]](#workflowItem)

outDeps

[workflowItem[]](#workflowItem)

