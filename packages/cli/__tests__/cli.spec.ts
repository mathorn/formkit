import { describe, it, expect, vi } from 'vitest'
import { buildTheme, extractThemeData } from '../src/theme'
import chalk from 'chalk'
import { readFile } from 'fs/promises'
import { resolve } from 'pathe'
import { createNode } from '@formkit/core'

describe('buildTheme', () => {
  it('can build a local theme', () => {
    const consoleMock = vi
      .spyOn(console, 'log')
      .mockImplementation(() => undefined)
    buildTheme({ theme: 'my-theme' })
    expect(consoleMock).toHaveBeenCalledWith(
      chalk.greenBright('Locating my-theme...')
    )
    consoleMock.mockRestore()
  })

  it('can generate a local theme', async () => {
    const consoleMock = vi
      .spyOn(console, 'log')
      .mockImplementation(() => undefined)
    await buildTheme({
      theme: './packages/cli/__tests__/mocks/localTheme',
      outFile: 'temp/formkit.theme.ts',
      format: 'ts',
    })

    expect(consoleMock).toHaveBeenNthCalledWith(
      1,
      chalk.greenBright('Locating ./packages/cli/__tests__/mocks/localTheme...')
    )
    const fileString = await readFile(
      resolve(process.cwd(), 'temp/formkit.theme.ts'),
      'utf-8'
    )
    expect(fileString).toMatchSnapshot()
  })

  it('can override variables in generated theme', async () => {
    await buildTheme({
      theme: './packages/cli/__tests__/mocks/localTheme',
      outFile: 'temp/formkit.theme.ts',
      format: 'ts',
      variables: 'border=border-6,spacing=10',
    })
    const fileString = await readFile(
      resolve(process.cwd(), 'temp/formkit.theme.ts'),
      'utf-8'
    )
    expect(fileString).toMatchSnapshot()
  })

  it('returns the correct classes for a given input section', async () => {
    await buildTheme({
      theme: './packages/cli/__tests__/mocks/localTheme',
      outFile: 'temp/formkit.theme.ts',
      format: 'ts',
      variables: 'spacing=5',
    })
    // @ts-ignore
    const { rootClasses } = await import(
      resolve(process.cwd(), 'temp/formkit.theme.ts')
    )
    const node = createNode({
      type: 'input',
      props: { type: 'text', rootClasses, family: 'text' },
    })

    // @ts-ignore
    expect(node.props.rootClasses!('outer', node)).toEqual({
      'border-green-300': true,
      'mb-5': true,
      'ml-80': true,
      'mr-10': true,
      'mt-2': true,
      'text-green-300': true,
    })
  })
})

describe('extractThemeData', () => {
  it('can extract basic details about a given theme', async () => {
    await buildTheme({
      theme: './packages/cli/__tests__/mocks/localTheme',
      outFile: 'temp/formkit.theme.ts',
      format: 'ts',
      variables: 'spacing=5',
    })
    const fileString = await readFile(
      resolve(process.cwd(), 'temp/formkit.theme.ts'),
      'utf-8'
    )
    const themeData = extractThemeData(fileString)
    expect(themeData).toEqual([
      '34e76d5a60cea82d8e83f7b3948333b0cab7c914ffdd792141e8db0a8e8e31da',
      'spacing=5',
      'simple',
    ])
  })
})
