import { GoogleAuth } from './google-jwt-sa.ts'
import appSettings from '../config/config.ts'

export async function listCourseMembers(
  auth: GoogleAuth,
  type: 'students' | 'teachers',
  courseAlias: string,
  index: number,
  total: number
) {
  const path = 'https://classroom.googleapis.com/v1/courses/'
  const id = encodeURIComponent(`d:${courseAlias}`)

  index = index || 0
  total = total || 0

  index = index + 1

  const delay = index * appSettings.taskDelay
  await sleep(delay)

  console.log(`Fetching ${type} for course: ${courseAlias} ${index} of ${total} tasks`)

  const response = await fetch(
    `${path}${id}/${type}`,
    {
      method: 'GET',
      headers: getHeaders(auth)
    }
  )
  const data = await processResponse(response)

  const members: string[] = []
  if (data[type]) {
    data[type].forEach((member: Record<string, unknown>) => {
      const memberProfile = member.profile as Record<string, string>
      members.push(memberProfile.emailAddress)
    })
  }

  return {
    courseAlias,
    [type]: members
  }
}

export async function listCourses(
  auth: GoogleAuth,
  type: 'teacherId' | 'studentId',
  userId: string
) {
  const path = 'https://classroom.googleapis.com/v1/courses/'
  const id = `${type}=${encodeURIComponent(userId)}`
  const pageSize = `pageSize=${appSettings.defaultPageSize}`

  const courses: Record<string, unknown>[] = []

  let nextPageToken = ''
  let courseCount = 0

  console.log(`\n%c[ Fetching remote Google Classroom courses for ${appSettings.classadmin} ]\n`, 'color:green')

  do {
    const pageToken = `pageToken=${nextPageToken}`

    const response = await fetch(
      `${path}?${id}&${pageSize}&${pageToken}`,
      {
        method: 'GET',
        headers: getHeaders(auth)
      }
    )

    const data = await processResponse(response)

    Array.prototype.push.apply(courses, data.courses)

    courseCount = courseCount + data.courses.length
    console.log(`%c[ ...${courseCount} courses ]`, 'color:lightblue')

    nextPageToken = data.nextPageToken
  } while (nextPageToken)
  console.log(`\n%c[ ${courseCount} total courses fetched ]\n`, 'color:cyan')

  return courses
}

export async function getCourseAliases(
  auth: GoogleAuth,
  courseId: string,
  index: number,
  total: number
) {
  const id = `${encodeURIComponent(courseId)}`
  index = index || 0
  total = total || 0

  index = index + 1

  const delay = index * appSettings.taskDelay
  await sleep(delay)

  console.log(`Fetching alias for course: ${courseId} ${index} of ${total} tasks`)

  const response = await fetch(
    `https://classroom.googleapis.com/v1/courses/${id}/aliases`,
    {
      method: 'GET',
      headers: getHeaders(auth)
    }
  )
  const data = await processResponse(response)

  const aliases: string[] = []
  if (data.aliases && data.aliases.length) {
    data.aliases.forEach((e: { alias: string }) => {
      aliases.push(e.alias.substring(2).trim())
    })
  }

  return {
    id: courseId,
    aliases
  }
}

async function processResponse(r: Response) {
  if (!r.ok) {
    const jsonData = await r.json()
    throw jsonData
  }
  const jsonData = await r.json()
  return jsonData
}

function getHeaders(auth: GoogleAuth) {
  return {
    "authorization": `Bearer ${auth.access_token}`,
    "content-type": "application/json",
    "accept": "application/json"
  }
}

function sleep(delay: number) {
  return new Promise(resolve => setTimeout(resolve, delay))
}