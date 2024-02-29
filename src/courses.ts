import { Store } from './store.ts'
import * as googleClassroom from './google-actions.ts'
import appSettings from '../config/config.ts'
import { tinyLogger } from './deps.ts'

export async function addCoursesToStore(store: Store) {
  const auth = store.auth

  const courses = await googleClassroom.listCourses(
    auth,
    'teacherId',
    appSettings.classadmin,
  )

  for (const course of courses) {
    if (!course) throw Error('addCoursesToStore(): course is undefined')

    if (!('id' in course && typeof course.id === 'string')) {
      throw Error('ƒ-addCoursesToStore id prop missing from course')
    }

    if (!('name' in course && typeof course.name === 'string')) {
      throw Error('ƒ-addCoursesToStore name prop missing from course')
    }

    if (
      !('courseState' in course && typeof course.courseState === 'string')
    ) throw Error('ƒ-addCoursesToStore courseState prop missing from course')

    if (
      !('ownerId' in course && typeof course.ownerId === 'string')
    ) throw Error('ƒ-addCoursesToStore ownerId prop missing from course')

    if (
      !('creationTime' in course && typeof course.creationTime === 'string')
    ) throw Error('ƒ-addCoursesToStore creationTime prop missing from course')

    if (!('section' in course && typeof course.section === 'string')) {
      tinyLogger.log(
        'addCoursesToStore()',
        `section field missing from course: ${course.name} id: ${course.id}`,
        {
          logLevel: 'warn',
          fileName: './log/log.csv',
        },
      )
    }

    if (!('description' in course && typeof course.description === 'string')) {
      tinyLogger.log(
        'addCoursesToStore()',
        `description field missing from course: ${course.name} id: ${course.id}`,
        {
          logLevel: 'warn',
          fileName: './log/log.csv',
        },
      )
    }

    if (
      !('descriptionHeading' in course && typeof course.descriptionHeading === 'string')
    ) {
      tinyLogger.log(
        'addCoursesToStore()',
        `descriptionHeading field missing from course: ${course.name} id: ${course.id}`,
        {
          logLevel: 'warn',
          fileName: './log/log.csv',
        },
      )
    }

    const googleCourseId = course.id
    store.remote.courses.set(googleCourseId, course)
  }
}

export async function addCourseAliasMapToStore(store: Store) {
  const auth = store.auth
  const courses = store.remote.courses

  const googleCoursesIds: string[] = []
  for (const [id, _course] of courses) {
    googleCoursesIds.push(id)
  }

  const courseAliases = await Promise.all(
    googleCoursesIds.map(async (course, index) => {
      return await googleClassroom.getCourseAliases(
        auth,
        course,
        index,
        googleCoursesIds.length,
      )
    }),
  )

  courseAliases.forEach((alias) => {
    const googleCourseId = alias.id
    alias.aliases.forEach((e) => {
      const courseAlias = e
      if (courseAlias.substring(0, 2) === appSettings.aliasVersion) {
        store.remote.courseAliases.set(courseAlias, googleCourseId)
        store.remote.courseIds.set(googleCourseId, courseAlias)
      }
    })
  })
}
